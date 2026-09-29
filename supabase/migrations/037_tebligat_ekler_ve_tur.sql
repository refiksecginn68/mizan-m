-- E-Tebligat: ek dosyalar (documents bucket, private, signed URL) + tebligat türü
-- + süre alanları. deadline_at zaten vardı (035 öncesi) ama hiçbir yerde
-- hesaplanmıyordu — bu FAZ'da lib/tebligat/sureler.ts ile dolduruluyor.

ALTER TABLE public.tebligat_records
  ADD COLUMN IF NOT EXISTS tur TEXT,
  ADD COLUMN IF NOT EXISTS tebligat_gonderim_tarihi TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deadline_dayanak TEXT,
  ADD COLUMN IF NOT EXISTS deadline_elle_girildi BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notified_thresholds INTEGER[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.tebligat_ekler (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tebligat_id   UUID NOT NULL REFERENCES public.tebligat_records(id) ON DELETE CASCADE,
  lawyer_id     UUID NOT NULL,
  ad            TEXT NOT NULL,
  storage_path  TEXT,
  durum         TEXT NOT NULL DEFAULT 'indirilemedi' CHECK (durum IN ('indirildi', 'indirilemedi')),
  hata_notu     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tebligat_ekler_tebligat ON public.tebligat_ekler(tebligat_id);

ALTER TABLE public.tebligat_ekler ENABLE ROW LEVEL SECURITY;

CREATE POLICY tebligat_ekler_select_own ON public.tebligat_ekler
  FOR SELECT USING (auth.uid() = lawyer_id);
