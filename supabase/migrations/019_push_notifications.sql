-- 019: Push bildirim abonelik tablosu ve profil bildirim tercihleri

-- Profiles tablosuna yeni bildirim tercih kolonları ekle
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_tasks BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_payments BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_tebligat BOOLEAN NOT NULL DEFAULT true;

-- Push aboneliklerini saklayacak tabloyu oluştur
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint   TEXT UNIQUE NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabloya RLS (Row Level Security) yetkilendirmesi ekle
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Kullanıcıların kendi aboneliklerini yönetebilmesi için politikalar
CREATE POLICY "push_subscriptions_all_own" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sorgu performansları için index'ler
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);
