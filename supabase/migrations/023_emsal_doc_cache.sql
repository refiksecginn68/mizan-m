-- Emsal karar tam metni için kalıcı önbellek.
-- Bellek içi cache (docTextCache) Vercel'de her cold start'ta sıfırlanıyor;
-- Bedesten'e her arama zenginleştirmesinde yeniden gitmek aramayı yavaşlatıyordu.
CREATE TABLE IF NOT EXISTS public.emsal_doc_cache (
  document_id  TEXT PRIMARY KEY,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.emsal_doc_cache ENABLE ROW LEVEL SECURITY;
-- Yalnızca service role okur/yazar; kullanıcıya doğrudan politika yok
