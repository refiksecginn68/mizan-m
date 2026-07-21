-- A1 derin UYAP taraması: taraf/evrak/safahat verileri artık notes metni yerine
-- yapılandırılmış JSONB kolonlarında tutulur; UI (Dosyalar tablosu + dava detay sekmeleri)
-- bunları doğrudan okur. uyap_acilis_tarihi UYAP'taki "Dosya Açılış Tarihi" metnidir.

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS uyap_taraflar       jsonb,
  ADD COLUMN IF NOT EXISTS uyap_evraklar       jsonb,
  ADD COLUMN IF NOT EXISTS uyap_safahat        jsonb,
  ADD COLUMN IF NOT EXISTS uyap_acilis_tarihi  text;

COMMENT ON COLUMN public.cases.uyap_taraflar      IS 'UYAP Taraf Bilgileri: [{rol,tip,ad,vekil,muvekkil:boolean}]';
COMMENT ON COLUMN public.cases.uyap_evraklar      IS 'UYAP Evrak ağacı yaprakları: [{ad,tarih,klasor}] (meta; byte içerik yok)';
COMMENT ON COLUMN public.cases.uyap_safahat       IS 'UYAP Safahat: [{tarih,islem,aciklama}]';
COMMENT ON COLUMN public.cases.uyap_acilis_tarihi IS 'UYAP Dosya Açılış Tarihi (ör. 04.05.2026 16:21)';

-- Takvimde aynı duruşmanın tekrar tekrar oluşmasını engelle (aktar route upsert anahtarı)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_calendar_durusma_case_start
  ON public.calendar_events (lawyer_id, case_id, starts_at)
  WHERE event_type = 'durusma' AND case_id IS NOT NULL;
