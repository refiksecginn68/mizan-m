-- Müvekkil belge talep sistemi
CREATE TABLE IF NOT EXISTS document_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token        TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  lawyer_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  case_id      UUID REFERENCES cases(id) ON DELETE SET NULL,
  message      TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','expired')),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS document_requests_token_idx ON document_requests(token);
CREATE INDEX IF NOT EXISTS document_requests_lawyer_idx ON document_requests(lawyer_id);

-- RLS
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avukat kendi taleplerini görür" ON document_requests
  FOR ALL USING (auth.uid() = lawyer_id);

-- Public token ile erişim (upload sayfası)
CREATE POLICY "Token ile talep görüntüleme" ON document_requests
  FOR SELECT USING (true);
