-- Avukat Pro/Max aylık fiyat güncellemesi: 1.990/3.990 TL → 1.000/2.000 TL.
-- B1 maliyet-marj analizi: kullanım/maliyet logu mevcut olmadığından kota
-- artışı (istenen %75) UYGULANMADI — bkz. oturum raporu.
UPDATE public.credit_packages SET price_try = 1000.00 WHERE code = 'pro';
UPDATE public.credit_packages SET price_try = 2000.00 WHERE code = 'max';
