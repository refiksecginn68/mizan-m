-- Dosya durumu UYAP'tan doğru yansısın diye status enum'ını genişletir.
-- Kök neden: cases.status CHECK yalnızca ('aktif','kapatildi','arsiv') kabul ediyordu, ama liste
-- UI'ı ve sayaç kartları 'beklemede' ve 'istinaf_temyiz' kovalarını da kullanıyor. Eklenti UYAP
-- durumunu (İstinafta, Yargıtayda, Kapalı, Karara Çıkmış...) bu kovalara eşleyip status'e yazacak;
-- CHECK bunları reddetmesin.

ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_status_check;
ALTER TABLE public.cases ADD CONSTRAINT cases_status_check
  CHECK (status IN ('aktif', 'beklemede', 'istinaf_temyiz', 'kapatildi', 'arsiv'));
