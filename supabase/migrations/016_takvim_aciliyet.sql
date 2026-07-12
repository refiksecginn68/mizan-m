-- Takvim etkinliklerine aciliyet + hatırlatıcı alanları (idempotent)
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS urgency TEXT NOT NULL DEFAULT 'orta'
    CHECK (urgency IN ('dusuk', 'orta', 'yuksek', 'acil')),
  ADD COLUMN IF NOT EXISTS reminder_offsets_minutes INTEGER[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reminders_sent_minutes INTEGER[] NOT NULL DEFAULT '{}';

-- Hatırlatıcı taraması için: yaklaşan ve hatırlatıcısı olan etkinlikler
CREATE INDEX IF NOT EXISTS idx_calendar_events_reminders
  ON public.calendar_events(starts_at)
  WHERE cardinality(reminder_offsets_minutes) > 0;
