-- Incremental indeksleme altyapısı:
-- law_embeddings'te (source_type, source_id) duplikatlarını temizle ve
-- UNIQUE constraint ekle — webhook upsert'ü onConflict ile idempotent çalışsın.
-- Çalıştır: npx tsx scripts/_run-sql.ts supabase/migrations/012_incremental_embeddings.sql

-- 1. Duplikat temizliği: her (source_type, source_id) çifti için en yeni satır kalır
DELETE FROM public.law_embeddings a
USING public.law_embeddings b
WHERE a.source_type = b.source_type
  AND a.source_id = b.source_id
  AND (a.created_at < b.created_at
       OR (a.created_at = b.created_at AND a.ctid < b.ctid));

-- 2. Unique constraint (idempotent)
ALTER TABLE public.law_embeddings
  DROP CONSTRAINT IF EXISTS law_embeddings_source_unique;
ALTER TABLE public.law_embeddings
  ADD CONSTRAINT law_embeddings_source_unique UNIQUE (source_type, source_id);
