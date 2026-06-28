-- ============================================================
-- MİZANIM — Bir Kere Çalıştır (supabase/ONCE_RUN_THIS.sql)
-- Supabase Dashboard → SQL Editor → Yapıştır → Run
-- ============================================================

-- Kredi ekleme fonksiyonu (ödeme sonrası kullanılır)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id     UUID,
  p_amount      INTEGER,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles
    SET credit_balance = credit_balance + p_amount
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_amount, 'purchase', p_description, p_reference_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
