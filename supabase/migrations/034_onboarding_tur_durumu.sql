-- Sayfa bazlı bir kerelik tanıtım turu tamamlanma durumu (avukat paneli).
-- localStorage YETMEZ: kullanıcı başka cihazda tekrar görmemeli.
CREATE TABLE IF NOT EXISTS public.onboarding_tur_durumu (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sayfa       TEXT NOT NULL,
  durum       TEXT NOT NULL CHECK (durum IN ('tamamlandi', 'atlandi')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, sayfa)
);

ALTER TABLE public.onboarding_tur_durumu ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_tur_durumu_select_own ON public.onboarding_tur_durumu
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY onboarding_tur_durumu_insert_own ON public.onboarding_tur_durumu
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY onboarding_tur_durumu_delete_own ON public.onboarding_tur_durumu
  FOR DELETE USING (auth.uid() = user_id);

-- upsert'in ON CONFLICT DO UPDATE yolu için gerekli (satır normalde bir kez yazılır,
-- ama eşzamanlı istek durumunda RLS reddi yerine güvenli no-op update sağlar)
CREATE POLICY onboarding_tur_durumu_update_own ON public.onboarding_tur_durumu
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
