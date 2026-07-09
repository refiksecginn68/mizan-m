-- ============================================================
-- MİZANIM — Migration 010: Lawyer Quota
-- ============================================================

-- profiles tablosuna kota sütunlarını ekle
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_query_limit INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_query_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_queries INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_cycle_reset TIMESTAMPTZ;

-- credit_packages tablosuna paket türünü ekle
ALTER TABLE public.credit_packages 
ADD COLUMN IF NOT EXISTS package_type TEXT NOT NULL DEFAULT 'credit' CHECK (package_type IN ('credit', 'query'));

-- Avukatlar için 100 sorguluk ek paket (kontör) tanımla
INSERT INTO public.credit_packages (name, credits, price_try, is_popular, package_type)
VALUES ('100 Sorgu Ek Paketi', 100, 250.00, true, 'query')
ON CONFLICT DO NOTHING;

-- FONKSİYON: spend_queries (atomik avukat sorgu harcama)
CREATE OR REPLACE FUNCTION public.spend_queries(
  p_user_id UUID,
  p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
  v_additional INTEGER;
  v_user_type TEXT;
  v_reset TIMESTAMPTZ;
BEGIN
  -- Kullanıcı bilgilerini kilitleyerek al
  SELECT user_type, monthly_query_limit, monthly_query_count, additional_queries, billing_cycle_reset
  INTO v_user_type, v_limit, v_count, v_additional, v_reset
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Avukat değilse işlemi iptal et
  IF v_user_type <> 'avukat' THEN
    RETURN FALSE;
  END IF;

  -- Fatura döngüsü/reset zamanı gelmiş mi kontrol et (Lazy Reset)
  IF v_reset IS NOT NULL AND NOW() > v_reset THEN
    -- Sayacı sıfırla ve yeni sıfırlama tarihini 1 ay sonrasına ayarla
    v_count := 0;
    UPDATE public.profiles
    SET monthly_query_count = 0,
        billing_cycle_reset = billing_cycle_reset + INTERVAL '1 month'
    WHERE id = p_user_id;
  END IF;

  -- Kalan sorgu miktarını kontrol et
  IF (v_limit + v_additional - v_count) >= p_amount THEN
    -- Sorguyu harca (sayacı artır)
    UPDATE public.profiles
    SET monthly_query_count = monthly_query_count + p_amount
    WHERE id = p_user_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FONKSİYON: add_queries (atomik avukat ek sorgu ekleme)
CREATE OR REPLACE FUNCTION public.add_queries(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Ek sorgu limitini artır
  UPDATE public.profiles
  SET additional_queries = additional_queries + p_amount
  WHERE id = p_user_id;

  -- İşlem logunu ekle
  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_amount, 'purchase', p_description, p_reference_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yetkilendirme
GRANT EXECUTE ON FUNCTION public.spend_queries TO service_role;
GRANT EXECUTE ON FUNCTION public.spend_queries TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_queries TO service_role;
GRANT EXECUTE ON FUNCTION public.add_queries TO authenticated;
