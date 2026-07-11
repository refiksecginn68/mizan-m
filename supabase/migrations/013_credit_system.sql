-- ============================================================
-- MİZANIM — Migration 013: Kredi/Ödeme Sistemi (manuel IBAN)
-- Geri alma: bkz. dosya sonu (aşağıdaki DOWN bloğu yorum içinde)
-- ============================================================

-- ── credit_packages: kod, kota, görünürlük, özellikler ─────────
ALTER TABLE public.credit_packages
  ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS query_quota INTEGER,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Eski (kodsuz) paketleri fiyat listesinden kaldır (silme yok, pasifleştirme)
UPDATE public.credit_packages SET is_active = false WHERE code IS NULL;

-- Yeni paketleri seed et (code üzerinden idempotent)
INSERT INTO public.credit_packages (code, name, credits, price_try, is_popular, is_active, package_type, query_quota, is_public, features)
VALUES
  ('vatandas',   'Vatandaş',           50,  299,  false, true, 'query',   50, true,
   '["AI soru-cevap","Belge analizi","Sınırsız emsal/mevzuat arama"]'::jsonb),
  ('pro',        'Avukat Pro',        750, 1990,  true,  true, 'query',  750, true,
   '["Tüm AI modülleri","CRM (müvekkil/dava/finans)","Sınırsız emsal/mevzuat arama","Dilekçe üretimi"]'::jsonb),
  ('max',        'Avukat Max',       2000, 3990,  false, true, 'query', 2000, true,
   '["Pro''daki her şey","UYAP/UETS eklenti aktivasyonu","Öncelikli destek"]'::jsonb),
  ('kontor_100', '100 Sorgu Kontör',  100,  300,  false, true, 'query',  100, true,
   '["Kota bitince ek 100 AI sorgusu","Süresiz geçerli"]'::jsonb),
  ('kontor_500', '500 Sorgu Kontör',  500, 1300,  false, true, 'query',  500, true,
   '["Kota bitince ek 500 AI sorgusu","Süresiz geçerli"]'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  credits = EXCLUDED.credits,
  price_try = EXCLUDED.price_try,
  is_popular = EXCLUDED.is_popular,
  is_active = EXCLUDED.is_active,
  package_type = EXCLUDED.package_type,
  query_quota = EXCLUDED.query_quota,
  is_public = EXCLUDED.is_public,
  features = EXCLUDED.features;

-- ── payment_requests ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_code TEXT NOT NULL REFERENCES public.credit_packages(code),
  amount_try INTEGER NOT NULL,
  reference_code TEXT NOT NULL UNIQUE,
  approval_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON public.payment_requests(user_id);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "payment_requests_select_own" ON public.payment_requests
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- approval_token client'a asla dönmesin: kolon bazlı SELECT yetkisi
REVOKE SELECT ON public.payment_requests FROM anon, authenticated;
GRANT SELECT (id, user_id, package_code, amount_try, reference_code, status, created_at, approved_at)
  ON public.payment_requests TO authenticated;

-- ── credit_transactions: ödeme talebi bağlantısı ────────────────
ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS payment_request_id UUID REFERENCES public.payment_requests(id);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "credit_transactions_select_own" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── payment_reminders (aylık havale hatırlatması) ───────────────
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_code TEXT NOT NULL,
  next_reminder_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, package_code)
);

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "payment_reminders_select_own" ON public.payment_reminders
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "payment_reminders_update_own" ON public.payment_reminders
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── profiles: UYAP/UETS eklenti aktivasyonu (Max) ───────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS uyap_uets_active BOOLEAN NOT NULL DEFAULT false;

-- ── spend_queries: tüketim sırası + işlem logu + vatandaş desteği ─
-- Kural: önce (monthly_query_limit - monthly_query_count), biterse
-- additional_queries kalıcı düşer (ay dönümünde geri gelmez).
CREATE OR REPLACE FUNCTION public.spend_queries(
  p_user_id UUID,
  p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
  v_additional INTEGER;
  v_reset TIMESTAMPTZ;
  v_from_monthly INTEGER;
  v_from_additional INTEGER;
BEGIN
  SELECT monthly_query_limit, monthly_query_count, additional_queries, billing_cycle_reset
  INTO v_limit, v_count, v_additional, v_reset
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Fatura döngüsü dolmuşsa aylık sayacı sıfırla (Lazy Reset)
  IF v_reset IS NOT NULL AND NOW() > v_reset THEN
    v_count := 0;
    UPDATE public.profiles
    SET monthly_query_count = 0,
        billing_cycle_reset = billing_cycle_reset + INTERVAL '1 month'
    WHERE id = p_user_id;
  END IF;

  v_from_monthly := LEAST(GREATEST(v_limit - v_count, 0), p_amount);
  v_from_additional := p_amount - v_from_monthly;

  IF v_from_additional > v_additional THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET monthly_query_count = monthly_query_count + v_from_monthly,
      additional_queries = additional_queries - v_from_additional
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'spend', 'AI sorgu harcaması');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── refund_queries: başarısız AI çağrısı kotadan yemez ──────────
CREATE OR REPLACE FUNCTION public.refund_queries(
  p_user_id UUID,
  p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_back_monthly INTEGER;
BEGIN
  SELECT monthly_query_count INTO v_count
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  v_back_monthly := LEAST(GREATEST(v_count, 0), p_amount);

  UPDATE public.profiles
  SET monthly_query_count = monthly_query_count - v_back_monthly,
      additional_queries = additional_queries + (p_amount - v_back_monthly)
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'refund', 'Başarısız AI çağrısı iadesi');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.spend_queries TO service_role;
GRANT EXECUTE ON FUNCTION public.spend_queries TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_queries TO service_role;

-- ============================================================
-- DOWN (geri alma) — gerekirse elle çalıştırın:
--   DROP FUNCTION IF EXISTS public.refund_queries(UUID, INTEGER);
--   (spend_queries'i 010_lawyer_quota.sql içindeki tanımla geri yükleyin)
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS uyap_uets_active;
--   DROP TABLE IF EXISTS public.payment_reminders;
--   ALTER TABLE public.credit_transactions DROP COLUMN IF EXISTS payment_request_id;
--   DROP TABLE IF EXISTS public.payment_requests;
--   ALTER TABLE public.credit_packages
--     DROP COLUMN IF EXISTS code, DROP COLUMN IF EXISTS query_quota,
--     DROP COLUMN IF EXISTS is_public, DROP COLUMN IF EXISTS features;
--   UPDATE public.credit_packages SET is_active = true WHERE ...;
-- ============================================================
