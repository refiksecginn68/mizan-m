-- KVKK/sözleşme onay kayıtları ve ilgili kişi başvuru formu
-- legal_consents: hesap silinse de ispat amacıyla saklanır (TBK m.146) — bu yüzden
-- user_id'ye ON DELETE CASCADE FK YOKTUR, bilinçli olarak profiles'tan bağımsızdır.
CREATE TABLE IF NOT EXISTS public.legal_consents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  email       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  version     TEXT NOT NULL,
  granted     BOOLEAN NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_consents_user ON public.legal_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_consents_slug ON public.legal_consents(slug, version);

ALTER TABLE public.legal_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY legal_consents_select_own ON public.legal_consents
  FOR SELECT USING (auth.uid() = user_id);

-- İlgili Kişi Başvuru Formu kayıtları (Veri Sorumlusuna Başvuru Tebliği)
CREATE TABLE IF NOT EXISTS public.kvkk_basvurulari (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_soyad        TEXT NOT NULL,
  kimlik_no       TEXT NOT NULL,
  adres           TEXT NOT NULL,
  eposta          TEXT,
  telefon         TEXT,
  iliski          TEXT,
  talep_konusu    TEXT[] NOT NULL,
  aciklama        TEXT NOT NULL,
  durum           TEXT NOT NULL DEFAULT 'yeni' CHECK (durum IN ('yeni', 'inceleniyor', 'yanitlandi')),
  yanit_son_tarih DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  yanitlandi_at   TIMESTAMPTZ
);

ALTER TABLE public.kvkk_basvurulari ENABLE ROW LEVEL SECURITY;
-- Formu yalnızca API route (service role) yazar/okur; doğrudan istemci erişimi yoktur.
