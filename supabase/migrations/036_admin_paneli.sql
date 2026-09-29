-- Admin paneli: rol veritabanında (JWT/istemci değerine güvenilmez), ve admin'in
-- içerik tablolarına (cases/clients/uyap_*/medya/mizanai/emsal_*) HİÇBİR GRANT'i
-- yoktur. Admin erişimi yalnızca aşağıdaki SECURITY DEFINER fonksiyonlar
-- üzerinden, yalnızca izin verilen kolonlarla mümkündür.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Her fonksiyon çağıranın is_admin olduğunu KENDİSİ doğrular — RPC'yi
-- authenticated herkes çağırabilir ama admin değilse istisna fırlatır.
CREATE OR REPLACE FUNCTION public._admin_dogrula() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Yetkisiz erişim' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- Üye listesi: SADECE izin verilen kolonlar. Dosya/müvekkil/medya/sohbet
-- içeriğine dair HİÇBİR kolon yok.
CREATE OR REPLACE FUNCTION public.admin_uye_listesi() RETURNS TABLE (
  id UUID,
  ad_soyad TEXT,
  email TEXT,
  user_type TEXT,
  paket_kodu TEXT,
  kredi_limiti INTEGER,
  kalan_kullanim INTEGER,
  kullanim_orani NUMERIC,
  kayit_tarihi TIMESTAMPTZ,
  uye_ay_sayisi INTEGER,
  son_giris TIMESTAMPTZ,
  durum TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._admin_dogrula();
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.user_type,
    CASE
      WHEN p.uyap_uets_active THEN 'max'
      WHEN p.monthly_query_limit >= 750 THEN 'pro'
      ELSE NULL
    END,
    (COALESCE(p.monthly_query_limit, 0) + COALESCE(p.additional_queries, 0)),
    GREATEST(0, (COALESCE(p.monthly_query_limit, 0) + COALESCE(p.additional_queries, 0)) - COALESCE(p.monthly_query_count, 0)),
    CASE WHEN (COALESCE(p.monthly_query_limit, 0) + COALESCE(p.additional_queries, 0)) > 0
      THEN ROUND(100.0 * COALESCE(p.monthly_query_count, 0) / (COALESCE(p.monthly_query_limit, 0) + COALESCE(p.additional_queries, 0)), 1)
      ELSE 0
    END,
    p.created_at,
    (DATE_PART('year', AGE(now(), p.created_at)) * 12 + DATE_PART('month', AGE(now(), p.created_at)))::INTEGER,
    u.last_sign_in_at,
    CASE
      WHEN COALESCE(p.monthly_query_limit, 0) > 0 OR COALESCE(p.additional_queries, 0) > 0 THEN 'aktif'
      WHEN p.trial_started_at IS NOT NULL AND p.trial_ends_at > now() THEN 'deneme'
      WHEN p.trial_started_at IS NOT NULL THEN 'suresi_dolmus'
      ELSE 'paketsiz'
    END
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.user_type = 'avukat'
  ORDER BY p.created_at DESC;
END;
$$;

-- Özet panel: üye sayıları + gelir. Gider/maliyet kalemi YOK — kullanım
-- maliyeti loglanmadığı için admin panelinde uydurma rakam gösterilmez.
CREATE OR REPLACE FUNCTION public.admin_ozet() RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sonuc JSON;
BEGIN
  PERFORM public._admin_dogrula();
  SELECT json_build_object(
    'uye_toplam', (SELECT count(*) FROM public.profiles WHERE user_type = 'avukat'),
    'uye_deneme', (SELECT count(*) FROM public.profiles WHERE user_type = 'avukat' AND trial_started_at IS NOT NULL AND trial_ends_at > now() AND COALESCE(monthly_query_limit,0) = 0 AND COALESCE(additional_queries,0) = 0),
    'uye_ucretli', (SELECT count(*) FROM public.profiles WHERE user_type = 'avukat' AND (COALESCE(monthly_query_limit,0) > 0 OR COALESCE(additional_queries,0) > 0)),
    'uye_suresi_dolmus', (SELECT count(*) FROM public.profiles WHERE user_type = 'avukat' AND trial_started_at IS NOT NULL AND trial_ends_at <= now() AND COALESCE(monthly_query_limit,0) = 0 AND COALESCE(additional_queries,0) = 0),
    'gelir_toplam_try', (SELECT COALESCE(sum(amount_try), 0) FROM public.payment_requests WHERE status = 'approved'),
    'gelir_bu_ay_try', (SELECT COALESCE(sum(amount_try), 0) FROM public.payment_requests WHERE status = 'approved' AND approved_at >= date_trunc('month', now())),
    'odeme_bekleyen_sayisi', (SELECT count(*) FROM public.payment_requests WHERE status = 'pending')
  ) INTO sonuc;
  RETURN sonuc;
END;
$$;

-- Ödeme talepleri listesi (dosya/müvekkil içeriği yok — payment_requests zaten
-- sadece finansal alanlar içerir).
CREATE OR REPLACE FUNCTION public.admin_odemeler() RETURNS TABLE (
  id UUID,
  kullanici_id UUID,
  ad_soyad TEXT,
  email TEXT,
  paket_kodu TEXT,
  tutar_try NUMERIC,
  referans_kodu TEXT,
  dekont_no TEXT,
  aciklama TEXT,
  durum TEXT,
  olusturma_tarihi TIMESTAMPTZ,
  onay_tarihi TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._admin_dogrula();
  RETURN QUERY
  SELECT pr.id, pr.user_id, p.full_name, p.email, pr.package_code, pr.amount_try,
         pr.reference_code, pr.receipt_no, pr.payer_note, pr.status, pr.created_at, pr.approved_at
  FROM public.payment_requests pr
  JOIN public.profiles p ON p.id = pr.user_id
  ORDER BY pr.created_at DESC;
END;
$$;

-- Onay: e-posta linkindeki (/api/odeme/onayla) mantığın admin-panel eşdeğeri.
-- Aynı çift-onay koruması: status='pending' şartıyla atomik güncelleme.
CREATE OR REPLACE FUNCTION public.admin_odeme_onayla(p_id UUID) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.payment_requests;
  v_quota INTEGER;
  v_yeni_bakiye INTEGER;
BEGIN
  PERFORM public._admin_dogrula();

  UPDATE public.payment_requests
  SET status = 'approved', approved_at = now(), approved_by = 'admin-panel:' || auth.uid()::text
  WHERE id = p_id AND status = 'pending'
  RETURNING * INTO v_req;

  IF v_req IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Talep bulunamadı veya zaten işlenmiş');
  END IF;

  SELECT query_quota INTO v_quota FROM public.credit_packages WHERE code = v_req.package_code;
  v_quota := COALESCE(v_quota, 0);

  UPDATE public.profiles
  SET additional_queries = COALESCE(additional_queries, 0) + v_quota,
      uyap_uets_active = CASE WHEN v_req.package_code = 'max' THEN true ELSE uyap_uets_active END
  WHERE id = v_req.user_id
  RETURNING additional_queries INTO v_yeni_bakiye;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, payment_request_id)
  VALUES (v_req.user_id, v_quota, 'purchase', 'Admin panel onayı: ' || v_req.reference_code, v_req.id);

  RETURN json_build_object('ok', true, 'user_id', v_req.user_id, 'quota', v_quota, 'yeni_bakiye', v_yeni_bakiye, 'package_code', v_req.package_code);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_odeme_reddet(p_id UUID, p_sebep TEXT) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_req public.payment_requests;
BEGIN
  PERFORM public._admin_dogrula();

  UPDATE public.payment_requests
  SET status = 'rejected', approved_at = now(), approved_by = 'admin-panel:' || auth.uid()::text, reject_reason = p_sebep
  WHERE id = p_id AND status = 'pending'
  RETURNING * INTO v_req;

  IF v_req IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Talep bulunamadı veya zaten işlenmiş');
  END IF;

  RETURN json_build_object('ok', true, 'user_id', v_req.user_id, 'reference_code', v_req.reference_code);
END;
$$;

-- reject_reason kolonu yoksa ekle (onayla/reddet fonksiyonları bunu kullanıyor)
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS reject_reason TEXT;

-- İçerik tablolarına (cases/clients/uyap_*/emsal_*/generated_documents vb.)
-- admin rolü için hiçbir GRANT verilmez — bu satırın "yokluğu" bilinçlidir.
-- authenticated rolü zaten RLS ile korunuyor; admin'in tek yetkisi yukarıdaki
-- fonksiyonlardır ve fonksiyonlar sadece izin verilen sütunları döner.
REVOKE ALL ON FUNCTION public._admin_dogrula() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_uye_listesi() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ozet() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_odemeler() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_odeme_onayla(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_odeme_reddet(UUID, TEXT) TO authenticated;
