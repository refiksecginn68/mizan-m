-- Müvekkile SMS hatırlatma altyapısı için onay alanı (İYS/KVKK: açık rıza kaydı)
-- phone alanı 001_schema.sql'de zaten mevcut
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sms_onay boolean NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sms_onay_tarihi timestamptz;
