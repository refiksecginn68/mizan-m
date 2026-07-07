-- Örnek dilekçe şablonu favorileri (sablon_id = dilekce-sablonlari.ts içindeki statik id)
CREATE TABLE IF NOT EXISTS dilekce_favoriler (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sablon_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sablon_id)
);

-- RLS: yalnızca service role erişir (diğer tablolarla aynı desen)
ALTER TABLE dilekce_favoriler ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_dilekce_favoriler_user ON dilekce_favoriler (user_id);
