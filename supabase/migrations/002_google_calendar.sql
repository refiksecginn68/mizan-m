-- Google OAuth tokenlarını saklayan tablo
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lawyer_id)
);

ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avukat kendi tokenina erisebilir"
  ON google_calendar_tokens FOR ALL
  USING (auth.uid() = lawyer_id);

-- calendar_events tablosuna Google event ID kolonu ekle
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;
