-- ============================================================
-- MİZANIM — Migration 017: Kontör fiyat dengesi
-- Eski kontör paketleri (100/300₺, 500/1300₺) pasifleşir;
-- yerine 1.000/1.999₺ ve 2.300/3.199₺ (En Avantajlı) gelir.
-- ============================================================

UPDATE public.credit_packages SET is_active = false
WHERE code IN ('kontor_100', 'kontor_500');

INSERT INTO public.credit_packages (code, name, credits, price_try, is_popular, is_active, package_type, query_quota, is_public, features)
VALUES
  ('kontor_1000', '1.000 Sorgu Kontör', 1000, 1999, false, true, 'query', 1000, true,
   '["Kota bitince ek 1.000 AI sorgusu","Süresiz geçerli"]'::jsonb),
  ('kontor_2300', '2.300 Sorgu Kontör', 2300, 3199, true,  true, 'query', 2300, true,
   '["Kota bitince ek 2.300 AI sorgusu","Sorgu başına %30 daha avantajlı","Süresiz geçerli"]'::jsonb)
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
