-- FAZ 1.1: Postgres hazırlığı (Supabase-fallback katmanı için — case_laws yalnızca
-- 12 satır demo veri, Bedesten canlı birincil motor; bu katman zaten var olan
-- RRF+rerank fallback yolunu güçlendirir).
CREATE EXTENSION IF NOT EXISTS unaccent;
-- pg_trgm zaten migration 005'te kurulu.

-- 'simple' + unaccent(lower(...)) konfigürasyonlu ikinci tsvector — aksan/yazım
-- toleransı için. Mevcut "fts" kolonu (migration 005, 'turkish' config) DOKUNULMADI.
ALTER TABLE public.case_laws ADD COLUMN IF NOT EXISTS ts_fold tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', unaccent(lower(coalesce(subject, '') || ' ' || coalesce(summary, ''))))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_case_laws_ts_fold ON public.case_laws USING gin (ts_fold);
