-- Cases tablosuna UYAP alanları ekle
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS case_type TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS uyap_status TEXT,
  ADD COLUMN IF NOT EXISTS is_uyap_synced BOOLEAN DEFAULT FALSE;

-- Vatandaş UYAP dosyaları tablosu
CREATE TABLE IF NOT EXISTS public.uyap_vatandas_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  esas_no       TEXT NOT NULL,
  mahkeme_adi   TEXT,
  dava_turu     TEXT,
  davaci        TEXT,
  davali        TEXT,
  hakim         TEXT,
  acilis_tarihi TIMESTAMPTZ,
  durumu        TEXT DEFAULT 'Devam Ediyor',
  dosya_json    JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, esas_no)
);

ALTER TABLE public.uyap_vatandas_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uyap_vf_select" ON public.uyap_vatandas_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "uyap_vf_insert" ON public.uyap_vatandas_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "uyap_vf_update" ON public.uyap_vatandas_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "uyap_vf_delete" ON public.uyap_vatandas_files
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_uyap_vf_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_uyap_vf_updated_at
  BEFORE UPDATE ON public.uyap_vatandas_files
  FOR EACH ROW EXECUTE FUNCTION public.update_uyap_vf_updated_at();
