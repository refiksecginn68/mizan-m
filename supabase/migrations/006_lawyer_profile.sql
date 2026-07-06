-- Avukat profil sayfası ek alanları (Faz 2 — M11)
-- bar_number, bar_city, avatar_url, phone, specializations zaten mevcut.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS achievements text,
  ADD COLUMN IF NOT EXISTS hobbies text,
  ADD COLUMN IF NOT EXISTS personal_notes text,
  ADD COLUMN IF NOT EXISTS profile_documents jsonb DEFAULT '[]'::jsonb;
