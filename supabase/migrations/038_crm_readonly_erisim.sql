-- CRM salt-okunur üyelik entegrasyonu: test hesaplarını gerçek üyelerden
-- ayırmak için tek bir flag. Okuma, service-role kullanan /api/crm/uyelikler
-- route'u tarafından yapılır — bu migration ek tablo/fonksiyon/RLS değişikliği
-- içermez.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- DOWN (geri alma) — gerekirse elle çalıştırın:
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_test_account;
-- ============================================================
