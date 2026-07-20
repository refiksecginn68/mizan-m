-- Görevlere öncelik alanı (Düşük / Orta / Yüksek) — ekleyici, idempotent.
-- Mevcut satırlar 'orta' varsayılanını alır; kod bu kovalarla çalışır.
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'orta';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'todos_priority_check'
  ) THEN
    ALTER TABLE public.todos
      ADD CONSTRAINT todos_priority_check CHECK (priority IN ('dusuk', 'orta', 'yuksek'));
  END IF;
END $$;
