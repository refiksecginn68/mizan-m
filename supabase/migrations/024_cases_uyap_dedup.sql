-- UYAP eklenti aktarımında oluşan mükerrer dosya kayıtlarını temizler ve tekrarını kalıcı engeller.
-- Kök neden: aktar endpoint'i (lawyer_id, case_number) için .single() kullanıyordu; grupta
-- 1'den fazla satır olunca .single() hata döndürüp mevcut kaydı bulamıyor ve HER taramada
-- yeni satır ekliyordu (9 → 28 kaçak büyüme). Bu migration mevcut kirliliği temizler,
-- benzersizlik anahtarını (lawyer_id + case_number + birim) DB seviyesinde zorunlu kılar.

BEGIN;

-- 1) Mükerrer grupları belirle: aynı avukat + esas no + birim (court normalize).
--    En dolu kaydı (notes en uzun), eşitlikte en güncel olanı "kazanan" seç; diğerleri silinecek.
CREATE TEMP TABLE _dedup ON COMMIT DROP AS
SELECT id,
       row_number() OVER w AS rn,
       first_value(id)  OVER w AS keep_id
FROM public.cases
WHERE case_number IS NOT NULL AND case_number <> ''
WINDOW w AS (
  PARTITION BY lawyer_id, case_number, COALESCE(court, '')
  ORDER BY length(COALESCE(notes, '')) DESC, updated_at DESC, created_at ASC, id
);

-- 2) Çocuk kayıtları kazanan dosyaya taşı (veri kaybı olmadan; case_documents CASCADE olduğu için şart)
UPDATE public.case_documents cd  SET case_id = d.keep_id FROM _dedup d WHERE cd.case_id = d.id AND d.rn > 1;
UPDATE public.sessions s         SET case_id = d.keep_id FROM _dedup d WHERE s.case_id  = d.id AND d.rn > 1;
UPDATE public.calendar_events e  SET case_id = d.keep_id FROM _dedup d WHERE e.case_id  = d.id AND d.rn > 1;
UPDATE public.tebligat_records t SET case_id = d.keep_id FROM _dedup d WHERE t.case_id  = d.id AND d.rn > 1;
UPDATE public.document_requests r SET case_id = d.keep_id FROM _dedup d WHERE r.case_id = d.id AND d.rn > 1;

-- 3) Mükerrerleri sil (yalnızca kazanan olmayan satırlar)
DELETE FROM public.cases c USING _dedup d WHERE c.id = d.id AND d.rn > 1;

-- 4) Kalıcı benzersizlik: aynı avukat + esas no + birim yalnızca bir kez girilebilir.
--    COALESCE(court,'') → birimi boş kayıtlar da tekilleşir (NULL'lar aksi halde çakışmaz).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cases_lawyer_casenumber_court
  ON public.cases (lawyer_id, case_number, COALESCE(court, ''))
  WHERE case_number IS NOT NULL AND case_number <> '';

COMMIT;
