-- ============================================================
-- MİZANIM — Migration 014: Eski vatandaş kredi bakiyesi devri
-- AI çağrıları artık credit_balance yerine sorgu kotası kullanıyor
-- (migration 013); mevcut bakiyeler additional_queries'e devredilir.
-- Idempotent: devir sonrası credit_balance=0 olduğundan ikinci
-- çalıştırma hiçbir satır bulmaz, çift yükleme yapmaz.
-- ============================================================

WITH kaynak AS (
  SELECT id, credit_balance
  FROM public.profiles
  WHERE credit_balance > 0
  FOR UPDATE
),
guncelle AS (
  UPDATE public.profiles p
  SET additional_queries = p.additional_queries + k.credit_balance,
      credit_balance = 0
  FROM kaynak k
  WHERE p.id = k.id
)
INSERT INTO public.credit_transactions (user_id, amount, type, description)
SELECT id, credit_balance, 'bonus', 'eski bakiye devri'
FROM kaynak;

-- ============================================================
-- DOWN (geri alma) — gerekirse elle çalıştırın:
--   Devri geri almak için 'eski bakiye devri' kayıtlarından okuyun:
--   UPDATE public.profiles p
--   SET credit_balance = t.amount,
--       additional_queries = GREATEST(p.additional_queries - t.amount, 0)
--   FROM public.credit_transactions t
--   WHERE t.user_id = p.id AND t.description = 'eski bakiye devri';
--   DELETE FROM public.credit_transactions WHERE description = 'eski bakiye devri';
-- ============================================================
