-- Ana sayfa favori kısayolları — kullanıcıya özel.
-- profiles zaten RLS'li (profiles_select_own + profiles_update_own, 001_schema),
-- yeni kolon bu politikaları devralır: kullanıcı yalnız kendi satırını güncelleyebilir.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dashboard_favorites text[]
  DEFAULT ARRAY['mizanai','yeni-dilekce','karar-arama','uyap-aktar']::text[];

-- Mevcut satırlarda null olanları varsayılanla doldur.
UPDATE public.profiles
  SET dashboard_favorites = ARRAY['mizanai','yeni-dilekce','karar-arama','uyap-aktar']::text[]
  WHERE dashboard_favorites IS NULL;
