-- Emsal arama geliştirmeleri: Turkish FTS generated kolonu + pg_trgm fuzzy
-- Çalıştırma: node scripts/run-migration.js supabase/migrations/005_emsal_search.sql

-- pg_trgm: benzer kelime (typo-toleranslı) arama
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Turkish full-text search için generated tsvector kolonu
-- (supabase-js textSearch() bir kolon adı gerektirir; expression index yetmez)
ALTER TABLE public.case_laws
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('turkish', coalesce(subject, '') || ' ' || coalesce(summary, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_case_laws_fts_col ON public.case_laws USING gin(fts);

-- Trigram indeksleri: ilike aramalarını hızlandırır
CREATE INDEX IF NOT EXISTS idx_case_laws_subject_trgm ON public.case_laws USING gin(subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_case_laws_summary_trgm ON public.case_laws USING gin(summary gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_case_laws_case_number ON public.case_laws(case_number);
CREATE INDEX IF NOT EXISTS idx_case_laws_decision_date ON public.case_laws(decision_date);
