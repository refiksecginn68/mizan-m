-- Admin dashboard metrikleri: gerçek AI maliyet logu + gelir/gider/kullanım/kota
-- RPC'leri. Tüm okuma fonksiyonları 036'daki _admin_dogrula() + SECURITY DEFINER
-- desenini kullanır; içerik tablolarına hiçbir grant verilmez.

-- ============================================================
-- 1) AI kullanım/maliyet logu
-- Her AI çağrısı (chat/dilekçe/emsal/medya/transcribe/embed) için model + token +
-- hesaplanan maliyet. Gider/API-maliyet ayağı bu tablodan beslenir.
-- Service-role yazar; anon/authenticated için policy yok → RLS ile okuma kapalı.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  surface TEXT NOT NULL,          -- chat | dilekce | dilekce_sorular | emsal | medya | transcribe | embed
  provider TEXT NOT NULL,         -- openrouter | anthropic | cohere | fal
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12,6) NOT NULL DEFAULT 0,
  cost_try NUMERIC(12,4) NOT NULL DEFAULT 0
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS ai_usage_log_created_idx ON public.ai_usage_log (created_at);
CREATE INDEX IF NOT EXISTS ai_usage_log_surface_idx ON public.ai_usage_log (surface);

-- ============================================================
-- 2) Özet: üye + gelir + GERÇEK gider (036'daki admin_ozet'in genişletilmiş hali)
-- ============================================================
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
    'gider_toplam_try', (SELECT COALESCE(sum(cost_try), 0) FROM public.ai_usage_log),
    'gider_bu_ay_try', (SELECT COALESCE(sum(cost_try), 0) FROM public.ai_usage_log WHERE created_at >= date_trunc('month', now())),
    'api_maliyet_bugun_try', (SELECT COALESCE(sum(cost_try), 0) FROM public.ai_usage_log WHERE created_at::date = current_date),
    'odeme_bekleyen_sayisi', (SELECT count(*) FROM public.payment_requests WHERE status = 'pending')
  ) INTO sonuc;
  RETURN sonuc;
END;
$$;

-- ============================================================
-- 3) Gelir-Gider: son N ay, aylık gelir (onaylı ödeme) vs gider (AI maliyeti)
-- ============================================================
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
                AND pr.approved_at < a.ay_bas + interval '1 month'), 0),
    COALESCE((SELECT sum(u.cost_try) FROM public.ai_usage_log u
              WHERE u.created_at >= a.ay_bas
                AND u.created_at < a.ay_bas + interval '1 month'), 0)
  FROM aylar a
  ORDER BY a.ay_bas;
END;
$$;

-- ============================================================
-- 4) API Maliyeti: son N gün — surface/model dağılımı + toplamlar
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_api_maliyet(p_gun_sayisi INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sonuc JSON; v_bas TIMESTAMPTZ;
BEGIN
  PERFORM public._admin_dogrula();
  v_bas := now() - (GREATEST(p_gun_sayisi, 1) || ' day')::interval;
  SELECT json_build_object(
    'toplam_try', COALESCE((SELECT sum(cost_try) FROM public.ai_usage_log WHERE created_at >= v_bas), 0),
    'toplam_usd', COALESCE((SELECT sum(cost_usd) FROM public.ai_usage_log WHERE created_at >= v_bas), 0),
    'toplam_cagri', COALESCE((SELECT count(*) FROM public.ai_usage_log WHERE created_at >= v_bas), 0),
    'surface_dagilim', COALESCE((SELECT json_agg(x) FROM (
        SELECT surface,
               sum(cost_try) AS cost_try,
               count(*) AS cagri,
               sum(input_tokens) AS input_tokens,
               sum(output_tokens) AS output_tokens
        FROM public.ai_usage_log WHERE created_at >= v_bas
        GROUP BY surface ORDER BY sum(cost_try) DESC) x), '[]'::json),
    'model_dagilim', COALESCE((SELECT json_agg(x) FROM (
        SELECT model, provider,
               sum(cost_try) AS cost_try,
               count(*) AS cagri
        FROM public.ai_usage_log WHERE created_at >= v_bas
        GROUP BY model, provider ORDER BY sum(cost_try) DESC) x), '[]'::json)
  ) INTO sonuc;
  RETURN sonuc;
END;
$$;

-- ============================================================
-- 5) Kullanım trendi: son N gün — günlük AI çağrı sayısı + maliyeti
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_kullanim_trend(p_gun_sayisi INTEGER DEFAULT 30)
RETURNS TABLE (gun DATE, sorgu_sayisi BIGINT, maliyet_try NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._admin_dogrula();
  RETURN QUERY
  WITH gunler AS (
    SELECT (current_date - gs)::date AS g
    FROM generate_series(0, GREATEST(p_gun_sayisi, 1) - 1) gs
  )
  SELECT
    d.g,
    COALESCE((SELECT count(*) FROM public.ai_usage_log u WHERE u.created_at::date = d.g), 0),
    COALESCE((SELECT sum(u.cost_try) FROM public.ai_usage_log u WHERE u.created_at::date = d.g), 0)
  FROM gunler d
  ORDER BY d.g;
END;
$$;

-- ============================================================
-- 6) Kota durumu: paket bazında üye sayısı + toplam/kullanılan kota
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_kota_durum()
RETURNS TABLE (paket TEXT, uye_sayisi BIGINT, toplam_kota BIGINT, kullanilan BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._admin_dogrula();
  RETURN QUERY
  SELECT
    CASE
      WHEN p.uyap_uets_active THEN 'max'
      WHEN COALESCE(p.monthly_query_limit, 0) >= 750 THEN 'pro'
      WHEN COALESCE(p.monthly_query_limit, 0) > 0 OR COALESCE(p.additional_queries, 0) > 0 THEN 'diger'
      ELSE 'paketsiz'
    END AS paket,
    count(*)::BIGINT,
    COALESCE(sum(COALESCE(p.monthly_query_limit, 0) + COALESCE(p.additional_queries, 0)), 0)::BIGINT,
    COALESCE(sum(COALESCE(p.monthly_query_count, 0)), 0)::BIGINT
  FROM public.profiles p
  WHERE p.user_type = 'avukat'
  GROUP BY 1
  ORDER BY 1;
END;
$$;

-- ============================================================
-- Grants: authenticated çağırabilir ama her fonksiyon _admin_dogrula() ile
-- kendini korur. ai_usage_log tablosuna hiçbir grant verilmez (service-role yazar).
-- ============================================================
GRANT EXECUTE ON FUNCTION public.admin_gelir_gider(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_api_maliyet(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_kullanim_trend(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_kota_durum() TO authenticated;

-- ============================================================
-- DOWN (geri alma) — gerekirse elle çalıştırın:
--   DROP FUNCTION IF EXISTS public.admin_kota_durum();
--   DROP FUNCTION IF EXISTS public.admin_kullanim_trend(INTEGER);
--   DROP FUNCTION IF EXISTS public.admin_api_maliyet(INTEGER);
--   DROP FUNCTION IF EXISTS public.admin_gelir_gider(INTEGER);
--   DROP TABLE IF EXISTS public.ai_usage_log;
--   (admin_ozet'i 036'daki haline döndürmek için 036'yı yeniden çalıştırın)
-- ============================================================
