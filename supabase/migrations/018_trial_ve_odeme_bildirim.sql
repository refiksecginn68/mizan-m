-- 018: Avukat deneme sistemi (8 gün + 1.000 sorgu) + ödeme bildirimi (dekont) alanları
--      + e-posta bildirim tercihi

-- ── profiles: deneme + bildirim tercihi ─────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_queries_left INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;

-- ── payment_requests: dekont bildirimi ──────────────────────────
ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS receipt_no TEXT,
  ADD COLUMN IF NOT EXISTS payer_note TEXT,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- ── handle_new_user: avukata otomatik deneme ────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
  v_bonus     INTEGER := 0;
  v_trial_start TIMESTAMPTZ := NULL;
  v_trial_end   TIMESTAMPTZ := NULL;
  v_trial_left  INTEGER := 0;
BEGIN
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'vatandas');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  -- Vatandaşa 20 kredi kayıt bonusu
  IF v_user_type = 'vatandas' THEN
    v_bonus := 20;
  END IF;

  -- Avukata 8 gün + 1.000 sorgu deneme (tüm özellikler, UYAP/UETS dahil)
  IF v_user_type = 'avukat' THEN
    v_trial_start := NOW();
    v_trial_end   := NOW() + INTERVAL '8 days';
    v_trial_left  := 1000;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, user_type, phone, bar_number, bar_city, credit_balance,
                               trial_started_at, trial_ends_at, trial_queries_left)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'bar_number',
    NEW.raw_user_meta_data->>'bar_city',
    v_bonus,
    v_trial_start,
    v_trial_end,
    v_trial_left
  );

  IF v_bonus > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, v_bonus, 'bonus', 'Kayıt bonusu');
  END IF;

  IF v_trial_left > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, v_trial_left, 'bonus', 'Deneme kredisi (8 gün, tüm özellikler)');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── spend_queries v3: deneme aktifse önce deneme kotası ─────────
-- Sıra: deneme (süresi geçmemişse) → aylık → kontör (additional).
CREATE OR REPLACE FUNCTION public.spend_queries(
  p_user_id UUID,
  p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
  v_additional INTEGER;
  v_reset TIMESTAMPTZ;
  v_trial_end TIMESTAMPTZ;
  v_trial_left INTEGER;
  v_from_trial INTEGER := 0;
  v_from_monthly INTEGER;
  v_from_additional INTEGER;
  v_kalan INTEGER;
BEGIN
  SELECT monthly_query_limit, monthly_query_count, additional_queries, billing_cycle_reset,
         trial_ends_at, trial_queries_left
  INTO v_limit, v_count, v_additional, v_reset, v_trial_end, v_trial_left
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

  -- Deneme aktifse önce deneme kotası
  IF v_trial_end IS NOT NULL AND NOW() < v_trial_end AND v_trial_left > 0 THEN
    v_from_trial := LEAST(v_trial_left, p_amount);
  END IF;

  v_kalan := p_amount - v_from_trial;
  v_from_monthly := LEAST(GREATEST(v_limit - v_count, 0), v_kalan);
  v_from_additional := v_kalan - v_from_monthly;

  IF v_from_additional > v_additional THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET trial_queries_left = trial_queries_left - v_from_trial,
      monthly_query_count = monthly_query_count + v_from_monthly,
      additional_queries = additional_queries - v_from_additional
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'spend', 'AI sorgu harcaması');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── refund_queries v2: deneme aktifse iadeyi denemeye yaz ───────
CREATE OR REPLACE FUNCTION public.refund_queries(
  p_user_id UUID,
  p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_trial_end TIMESTAMPTZ;
  v_back_monthly INTEGER;
BEGIN
  SELECT monthly_query_count, trial_ends_at INTO v_count, v_trial_end
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_trial_end IS NOT NULL AND NOW() < v_trial_end THEN
    UPDATE public.profiles
    SET trial_queries_left = trial_queries_left + p_amount
    WHERE id = p_user_id;
  ELSE
    v_back_monthly := LEAST(GREATEST(v_count, 0), p_amount);
    UPDATE public.profiles
    SET monthly_query_count = monthly_query_count - v_back_monthly,
        additional_queries = additional_queries + (p_amount - v_back_monthly)
    WHERE id = p_user_id;
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'refund', 'Başarısız AI çağrısı iadesi');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
