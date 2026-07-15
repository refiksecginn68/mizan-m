-- Dilekçe örnek korpusu + kendi RAG katmanı.
-- İçtihat/mevzuat RAG'inden (law_embeddings) AYRIDIR: örnek dilekçe = ÜSLUP ve YAPI kaynağı,
-- içtihat/mevzuat = HUKUKİ DAYANAK kaynağı. İkisi birlikte kullanılabilir.
--
-- Çalıştırma: npx tsx scripts/_run-sql.ts supabase/migrations/020_dilekce_ornekleri.sql
--
-- NOT: embedding boyutu 1024'tür (Cohere embed-multilingual-v3.0).
-- law_embeddings de canlıda vector(1024)'tür; 001_schema.sql'deki 1536 değeri eskidir.

CREATE TABLE IF NOT EXISTS public.dilekce_ornekleri (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Statik şablon korpusundan geldiyse kaynak id (src/lib/data/dilekce-sablonlari)
  sablon_id        TEXT UNIQUE,
  baslik           TEXT NOT NULL,
  aciklama         TEXT,
  kategori         TEXT NOT NULL,
  dava_turu        TEXT,
  dilekce_tipi     TEXT,
  yetkili_mahkeme  TEXT,
  -- ozgun: sıfırdan yazılmış | ictihat: kamuya açık karardan anonimleştirilmiş | resmi: resmî form
  kaynak           TEXT NOT NULL DEFAULT 'ozgun'
                     CHECK (kaynak IN ('ozgun', 'ictihat', 'resmi')),
  -- ictihat kaynaklı kayıtlarda kararın künyesi (izlenebilirlik)
  kaynak_kunye     TEXT,
  icerik           TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dilekce_ornekleri_kategori_idx ON public.dilekce_ornekleri (kategori);
CREATE INDEX IF NOT EXISTS dilekce_ornekleri_kaynak_idx   ON public.dilekce_ornekleri (kaynak);
CREATE INDEX IF NOT EXISTS dilekce_ornekleri_fts_idx      ON public.dilekce_ornekleri
  USING gin(to_tsvector('turkish', baslik || ' ' || coalesce(dava_turu, '') || ' ' || icerik));

-- Yapı-farkında chunk: her parça dilekçenin hangi bölümüne ait olduğunu bilir
CREATE TABLE IF NOT EXISTS public.dilekce_ornek_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ornek_id      UUID NOT NULL REFERENCES public.dilekce_ornekleri(id) ON DELETE CASCADE,
  -- ör. 'baslik', 'taraflar', 'konu', 'aciklamalar', 'hukuki_nedenler', 'deliller', 'sonuc_istem', 'tam'
  bolum         TEXT NOT NULL,
  content_chunk TEXT NOT NULL,
  embedding     vector(1024),
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dilekce_ornek_emb_ornek_idx ON public.dilekce_ornek_embeddings (ornek_id);
CREATE INDEX IF NOT EXISTS dilekce_ornek_emb_bolum_idx ON public.dilekce_ornek_embeddings (bolum);
CREATE INDEX IF NOT EXISTS dilekce_ornek_emb_vec_idx   ON public.dilekce_ornek_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- Korpus tüm avukatların ortak kaynağıdır: okuma serbest, yazma yalnızca service role.
ALTER TABLE public.dilekce_ornekleri        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dilekce_ornek_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dilekce_ornekleri_read ON public.dilekce_ornekleri;
CREATE POLICY dilekce_ornekleri_read ON public.dilekce_ornekleri
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS dilekce_ornek_emb_read ON public.dilekce_ornek_embeddings;
CREATE POLICY dilekce_ornek_emb_read ON public.dilekce_ornek_embeddings
  FOR SELECT TO authenticated USING (true);

-- Örnek dilekçe semantik araması. İçtihat RAG'inden ayrı bir uçtur.
CREATE OR REPLACE FUNCTION public.dilekce_ornek_search(
  query_embedding vector(1024),
  match_threshold FLOAT DEFAULT 0.60,
  match_count     INTEGER DEFAULT 5,
  kategori_filter TEXT DEFAULT NULL,
  bolum_filter    TEXT DEFAULT NULL
)
RETURNS TABLE (
  ornek_id        UUID,
  sablon_id       TEXT,
  baslik          TEXT,
  kategori        TEXT,
  dava_turu       TEXT,
  dilekce_tipi    TEXT,
  yetkili_mahkeme TEXT,
  kaynak          TEXT,
  bolum           TEXT,
  content_chunk   TEXT,
  similarity      FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    o.id,
    o.sablon_id,
    o.baslik,
    o.kategori,
    o.dava_turu,
    o.dilekce_tipi,
    o.yetkili_mahkeme,
    o.kaynak,
    e.bolum,
    e.content_chunk,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.dilekce_ornek_embeddings e
  JOIN public.dilekce_ornekleri o ON o.id = e.ornek_id
  WHERE e.embedding IS NOT NULL
    AND (kategori_filter IS NULL OR o.kategori = kategori_filter)
    AND (bolum_filter    IS NULL OR e.bolum    = bolum_filter)
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;
