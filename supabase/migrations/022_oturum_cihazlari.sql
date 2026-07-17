-- Eşzamanlı oturum limiti: hesap başına aktif cihaz kaydı.
-- Yeni giriş limit üstündeki en eski cihazı düşürür (revoked=true);
-- düşürülen cihaz ilk kalp atışında (heartbeat) oturumdan çıkarılır.
CREATE TABLE IF NOT EXISTS public.user_devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id     TEXT NOT NULL,
  user_agent    TEXT,
  ip            TEXT,
  revoked       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Kullanıcı yalnızca kendi cihazlarını görebilir; yazma service role üzerinden
CREATE POLICY "user_devices_select_own" ON public.user_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON public.user_devices(user_id) WHERE NOT revoked;
