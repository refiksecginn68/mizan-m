-- SQL RPC function for hybrid case law search with metadata pre-filtering
-- Run with: npx tsx scripts/_run-sql.ts supabase/migrations/011_hybrid_search.sql

CREATE OR REPLACE FUNCTION public.semantic_search_case_laws(
  query_embedding    vector(1536),
  court_filter       TEXT DEFAULT NULL,
  daire_filter       TEXT DEFAULT NULL,
  esas_filter        TEXT DEFAULT NULL,
  karar_filter       TEXT DEFAULT NULL,
  start_date_filter  DATE DEFAULT NULL,
  end_date_filter    DATE DEFAULT NULL,
  match_threshold    FLOAT DEFAULT 0.5,
  match_count        INTEGER DEFAULT 50
)
RETURNS TABLE (
  id            UUID,
  court         TEXT,
  source        TEXT,
  case_number   TEXT,
  decision_number TEXT,
  decision_date   DATE,
  subject       TEXT,
  summary       TEXT,
  similarity    FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id,
    cl.court,
    cl.source,
    cl.case_number,
    cl.decision_number,
    cl.decision_date,
    cl.subject,
    cl.summary,
    (1 - (le.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.law_embeddings le
  JOIN public.case_laws cl ON le.source_id = cl.id
  WHERE
    le.source_type = 'karar'
    AND (court_filter IS NULL OR cl.source = court_filter)
    AND (daire_filter IS NULL OR cl.court ILIKE '%' || daire_filter || '%')
    AND (esas_filter IS NULL OR cl.case_number ILIKE '%' || esas_filter || '%')
    AND (karar_filter IS NULL OR cl.decision_number ILIKE '%' || karar_filter || '%')
    AND (start_date_filter IS NULL OR cl.decision_date >= start_date_filter)
    AND (end_date_filter IS NULL OR cl.decision_date <= end_date_filter)
    AND 1 - (le.embedding <=> query_embedding) > match_threshold
  ORDER BY le.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
