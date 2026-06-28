-- ============================================================
-- MİZANIM — Supabase Storage Bucket Kurulumu
-- Supabase Dashboard → SQL Editor'da çalıştırın (bir kere)
-- ============================================================

-- 1. Bucket: documents (kullanıcı yüklemeleri — private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Bucket: generated-documents (üretilen belgeler — public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-documents',
  'generated-documents',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage Politikaları
-- ============================================================

-- documents: kullanıcı kendi klasörüne yükleyebilir
CREATE POLICY "documents_upload_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "documents_read_own"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "documents_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- generated-documents: kullanıcı kendi dosyalarını yükler, herkes okur
CREATE POLICY "generated_upload_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated-documents' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "generated_read_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-documents');
