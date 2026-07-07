-- İletişim formu mesajları (birincil kayıt — mail gitmese de mesaj kaybolmaz)
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_soyad text NOT NULL,
  email text NOT NULL,
  konu text NOT NULL,
  mesaj text NOT NULL,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: yalnızca service role erişir (public policy YOK)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Rate limit sorgusu için indeks
CREATE INDEX IF NOT EXISTS idx_contact_messages_ip_created
  ON contact_messages (ip, created_at DESC);
