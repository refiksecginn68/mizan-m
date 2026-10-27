-- admin_odemeler (036) ve admin_gelir_gider (040) fonksiyonlarinda tip uyumsuzlugu
-- duzeltmesi: payment_requests.amount_try kolonu INTEGER, ancak her iki fonksiyon
-- da NUMERIC donus tipi bekliyordu ("structure of query does not match function
-- result type" hatasi). Donus degerleri aciktan ::NUMERIC'e cast edilir.

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
  SELECT pr.id, pr.user_id, p.full_name, p.email, pr.package_code, pr.amount_try::NUMERIC,
         pr.reference_code, pr.receipt_no, pr.payer_note, pr.status, pr.created_at, pr.approved_at
  FROM public.payment_requests pr
  JOIN public.profiles p ON p.id = pr.user_id
  ORDER BY pr.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_gelir_gider(p_ay_sayisi INTEGER DEFAULT 6)
RETURNS TABLE (ay TEXT, gelir_try NUMERIC, gider_try NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._admin_dogrula();
  RETURN QUERY
  WITH aylar AS (
    SELECT date_trunc('month', now()) - (gs || ' month')::interval AS ay_bas
    FROM generate_series(0, GREATEST(p_ay_sayisi, 1) - 1) gs
  )
  SELECT
    to_char(a.ay_bas, 'YYYY-MM'),
    COALESCE((SELECT sum(pr.amount_try) FROM public.payment_requests pr
              WHERE pr.status = 'approved'
                AND pr.approved_at >= a.ay_bas
                AND pr.approved_at < a.ay_bas + interval '1 month'), 0)::NUMERIC,
    COALESCE((SELECT sum(u.cost_try) FROM public.ai_usage_log u
              WHERE u.created_at >= a.ay_bas
                AND u.created_at < a.ay_bas + interval '1 month'), 0)::NUMERIC
  FROM aylar a
  ORDER BY a.ay_bas;
END;
$$;

-- ============================================================
-- DOWN (geri alma) — gerekirse elle calistirin:
--   036_admin_paneli.sql ve 040_admin_dashboard_metrikleri.sql'deki
--   orijinal CREATE OR REPLACE FUNCTION bloklarini (cast'siz halleriyle)
--   yeniden calistirin.
-- ============================================================
