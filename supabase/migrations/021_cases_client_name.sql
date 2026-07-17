-- Müvekkil kaydı olmadan dosya açma: manuel isim-soyisim alanı.
-- client_id boşken client_name doldurulabilir; ikisi de boşsa dosya bağımsız/konu dosyasıdır.
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS client_name TEXT;

COMMENT ON COLUMN public.cases.client_name IS 'Müvekkil kaydı olmadan girilen manuel isim (client_id yoksa kullanılır)';
