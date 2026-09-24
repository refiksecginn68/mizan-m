-- FAZ 2 sonucu: karar-chunker.ts ile ölçülen yapısal bölüm/künye/madde-atfı
-- verisinin emsal_doc_cache'e kalıcı yazılması için alan (bkz. emsal-arama-motoru-faz).
ALTER TABLE public.emsal_doc_cache
  ADD COLUMN IF NOT EXISTS kunye jsonb,
  ADD COLUMN IF NOT EXISTS chunks jsonb,
  ADD COLUMN IF NOT EXISTS madde_atiflari jsonb,
  ADD COLUMN IF NOT EXISTS chunked_at timestamptz;
