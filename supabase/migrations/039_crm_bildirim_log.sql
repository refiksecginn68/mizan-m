-- CRM bildirim maillerinin (yeni üyelik / ödeme alındı / deneme bitiyor)
-- "her olay için tek mail" garantisi: gönderimden ÖNCE bu tabloya idempotency
-- key ile insert denenir; (event_type, idempotency_key) zaten varsa (webhook
-- tekrarı, çift tıklama vb.) insert 0 satır döner ve mail gönderilmez.
CREATE TABLE IF NOT EXISTS public.crm_bildirim_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('yeni_uyelik', 'odeme_alindi', 'deneme_bitiyor')),
  idempotency_key TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_type, idempotency_key)
);

-- Sadece service_role erişir (API route'ları service-role client kullanıyor);
-- anon/authenticated için hiçbir policy tanımlanmıyor, RLS açık → erişim yok.
ALTER TABLE public.crm_bildirim_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DOWN (geri alma) — gerekirse elle çalıştırın:
--   DROP TABLE IF EXISTS public.crm_bildirim_log;
-- ============================================================
