-- UYAP evrak İÇERİK metni (önemli evrak türlerinin PDF metin katmanı).
-- cases zaten RLS'li (lawyer_id = auth.uid()); yeni kolon bu politikaları devralır.
-- uyap_evraklar HAFİF kalır (metadata); metin burada anahtar→metin haritası olarak
-- ayrı tutulur ki dava sayfası ağacı şişmesin (bkz. uyap-evrak-icerik-cekimi tasarımı).

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS uyap_evrak_metinleri jsonb;
