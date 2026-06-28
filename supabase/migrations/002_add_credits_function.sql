-- ============================================================
-- MİZANIM — Migration 002: add_credits fonksiyonu
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Bakiyeyi artır
  UPDATE public.profiles
  SET credit_balance = credit_balance + p_amount
  WHERE id = p_user_id;

  -- İşlem logunu ekle
  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_amount, 'purchase', p_description, p_reference_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Servis rolüne çalıştırma yetkisi ver
GRANT EXECUTE ON FUNCTION public.add_credits TO service_role;
