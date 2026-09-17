-- Finans "Yeni Kayıt" modalında Muhasebe Türü serbest yazımına izin verir; kullanıcının
-- yazdığı özel kalemler kayıt türüne (müvekkil/serbest/gider) göre ayrı saklanır ki
-- sonraki kayıtlarda listede çıksın. profiles zaten RLS'li; yeni kolon bunu devralır.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ozel_muhasebe_turleri jsonb
  DEFAULT '{"muvekkil": [], "serbest": [], "gider": []}'::jsonb;
