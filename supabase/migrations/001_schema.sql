-- ============================================================
-- MİZANIM — Tam Veritabanı Şeması
-- Tablo oluşturma sırası bağımlılıklara göre düzenlenmiştir.
-- ============================================================

-- pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  user_type     TEXT NOT NULL CHECK (user_type IN ('avukat', 'vatandas')),
  avatar_url    TEXT,
  phone         TEXT,
  bar_number    TEXT,
  bar_city      TEXT,
  credit_balance INTEGER NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. LAW_AREAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.law_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT 'scale',
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.law_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "law_areas_public_read" ON public.law_areas
  FOR SELECT USING (true);

-- ============================================================
-- 3. CREDIT_PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  credits     INTEGER NOT NULL CHECK (credits > 0),
  price_try   NUMERIC(10,2) NOT NULL CHECK (price_try > 0),
  is_popular  BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_packages_public_read" ON public.credit_packages
  FOR SELECT USING (is_active = true);

-- ============================================================
-- 4. SUBSCRIPTION_PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE CHECK (slug IN ('baslangic', 'profesyonel', 'buro')),
  price_monthly  NUMERIC(10,2) NOT NULL,
  price_yearly   NUMERIC(10,2) NOT NULL,
  features       JSONB NOT NULL DEFAULT '[]',
  is_active      BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_public_read" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- ============================================================
-- 5. CREDIT_TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('spend', 'purchase', 'bonus', 'refund')),
  description  TEXT NOT NULL,
  reference_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_transactions_select_own" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- ============================================================
-- 6. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id                  UUID NOT NULL REFERENCES public.subscription_plans(id),
  status                   TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at               TIMESTAMPTZ,
  cancelled_at             TIMESTAMPTZ,
  payment_provider         TEXT,
  provider_subscription_id TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount              NUMERIC(10,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'TRY',
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  provider            TEXT NOT NULL,
  provider_payment_id TEXT,
  description         TEXT,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);

-- ============================================================
-- 8. CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  tc_no      TEXT,
  address    TEXT,
  notes      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_lawyer_only" ON public.clients
  FOR ALL USING (auth.uid() = lawyer_id);

CREATE INDEX idx_clients_lawyer_id ON public.clients(lawyer_id);

-- ============================================================
-- 9. CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  case_number     TEXT,
  court           TEXT,
  law_area_id     UUID REFERENCES public.law_areas(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'kapatildi', 'arsiv')),
  description     TEXT,
  opposing_party  TEXT,
  notes           TEXT,
  opened_at       DATE,
  closed_at       DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cases_lawyer_only" ON public.cases
  FOR ALL USING (auth.uid() = lawyer_id);

CREATE INDEX idx_cases_lawyer_id ON public.cases(lawyer_id);
CREATE INDEX idx_cases_client_id ON public.cases(client_id);
CREATE INDEX idx_cases_status ON public.cases(status);

-- ============================================================
-- 10. CASE_DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  lawyer_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type    TEXT NOT NULL,
  file_size    BIGINT NOT NULL,
  ai_summary   TEXT,
  ai_risks     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_documents_lawyer_only" ON public.case_documents
  FOR ALL USING (auth.uid() = lawyer_id);

CREATE INDEX idx_case_documents_case_id ON public.case_documents(case_id);

-- ============================================================
-- 11. SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Yeni Sohbet',
  law_area_id UUID REFERENCES public.law_areas(id) ON DELETE SET NULL,
  case_id     UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own" ON public.sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);

-- ============================================================
-- 12. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  sources     JSONB,
  credit_cost INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_own" ON public.messages
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_messages_session_id ON public.messages(session_id);

-- ============================================================
-- 13. DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type    TEXT NOT NULL,
  file_size    BIGINT NOT NULL,
  ai_summary   TEXT,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_own" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_expires_at ON public.documents(expires_at);

-- ============================================================
-- 14. GENERATED_DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generated_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  document_type TEXT NOT NULL,
  content       TEXT NOT NULL,
  pdf_path      TEXT,
  docx_path     TEXT,
  law_area_id   UUID REFERENCES public.law_areas(id) ON DELETE SET NULL,
  credit_cost   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generated_documents_select_own" ON public.generated_documents
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_generated_documents_user_id ON public.generated_documents(user_id);

-- ============================================================
-- 15. LEGISLATION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.legislation (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  number         TEXT,
  source         TEXT NOT NULL CHECK (source IN ('kanun', 'yonetmelik', 'teblig', 'anayasa')),
  content        TEXT NOT NULL,
  article_number TEXT,
  law_area_id    UUID REFERENCES public.law_areas(id) ON DELETE SET NULL,
  published_at   DATE,
  is_current     BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.legislation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legislation_public_read" ON public.legislation
  FOR SELECT USING (true);

CREATE INDEX idx_legislation_source ON public.legislation(source);
CREATE INDEX idx_legislation_law_area ON public.legislation(law_area_id);
CREATE INDEX idx_legislation_fts ON public.legislation
  USING gin(to_tsvector('turkish', title || ' ' || content));

-- ============================================================
-- 16. CASE_LAWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_laws (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court           TEXT NOT NULL,
  source          TEXT NOT NULL CHECK (source IN ('yargitay', 'danistay', 'aym', 'bam', 'diger')),
  case_number     TEXT NOT NULL,
  decision_number TEXT,
  decision_date   DATE,
  subject         TEXT NOT NULL,
  summary         TEXT NOT NULL,
  full_text       TEXT,
  law_area_id     UUID REFERENCES public.law_areas(id) ON DELETE SET NULL,
  keywords        TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.case_laws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_laws_public_read" ON public.case_laws
  FOR SELECT USING (true);

CREATE INDEX idx_case_laws_source ON public.case_laws(source);
CREATE INDEX idx_case_laws_law_area ON public.case_laws(law_area_id);
CREATE INDEX idx_case_laws_fts ON public.case_laws
  USING gin(to_tsvector('turkish', subject || ' ' || summary));

-- ============================================================
-- 17. LAW_EMBEDDINGS (pgvector)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.law_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type   TEXT NOT NULL CHECK (source_type IN ('kanun', 'karar', 'anayasa')),
  source_id     UUID NOT NULL,
  content_chunk TEXT NOT NULL,
  embedding     vector(1536),
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.law_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "law_embeddings_public_read" ON public.law_embeddings
  FOR SELECT USING (true);

CREATE INDEX idx_law_embeddings_source ON public.law_embeddings(source_type, source_id);
CREATE INDEX idx_law_embeddings_vector ON public.law_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- 18. CALENDAR_EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id          UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  event_type       TEXT NOT NULL DEFAULT 'diger' CHECK (event_type IN ('durusma', 'toplanti', 'sure', 'diger')),
  starts_at        TIMESTAMPTZ NOT NULL,
  ends_at          TIMESTAMPTZ,
  location         TEXT,
  is_reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_lawyer_only" ON public.calendar_events
  FOR ALL USING (auth.uid() = lawyer_id);

CREATE INDEX idx_calendar_events_lawyer_id ON public.calendar_events(lawyer_id);
CREATE INDEX idx_calendar_events_starts_at ON public.calendar_events(starts_at);

-- ============================================================
-- 19. TEBLIGAT_RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tebligat_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_id      UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  uets_id      TEXT,
  sender       TEXT NOT NULL,
  subject      TEXT NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL,
  deadline_at  TIMESTAMPTZ,
  is_processed BOOLEAN NOT NULL DEFAULT false,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tebligat_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tebligat_records_lawyer_only" ON public.tebligat_records
  FOR ALL USING (auth.uid() = lawyer_id);

CREATE INDEX idx_tebligat_records_lawyer_id ON public.tebligat_records(lawyer_id);

-- ============================================================
-- 20. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('durusma', 'tebligat', 'sure', 'sistem', 'kredi')),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  reference_id UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- ============================================================
-- TRIGGER: updated_at otomatik güncelleme
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_legislation_updated_at
  BEFORE UPDATE ON public.legislation
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TRIGGER: Yeni kullanıcı kaydında profil oluştur + kayıt bonusu
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
  v_bonus     INTEGER := 0;
BEGIN
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'vatandas');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  -- Vatandaşa 20 kredi kayıt bonusu
  IF v_user_type = 'vatandas' THEN
    v_bonus := 20;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, user_type, phone, bar_number, bar_city, credit_balance)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'bar_number',
    NEW.raw_user_meta_data->>'bar_city',
    v_bonus
  );

  -- Kayıt bonusu varsa credit_transactions'a ekle
  IF v_bonus > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, v_bonus, 'bonus', 'Kayıt bonusu');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FONKSİYON: spend_credits (atomik kredi harcama)
-- ============================================================
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id     UUID,
  p_amount      INTEGER,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Bakiyeyi kilitle
  SELECT credit_balance INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Bakiyeyi düş
  UPDATE public.profiles
  SET credit_balance = credit_balance - p_amount
  WHERE id = p_user_id;

  -- Log ekle
  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, -p_amount, 'spend', p_description, p_reference_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONKSİYON: semantic_search (pgvector)
-- ============================================================
CREATE OR REPLACE FUNCTION public.semantic_search(
  query_embedding    vector(1536),
  source_type_filter TEXT DEFAULT NULL,
  match_threshold    FLOAT DEFAULT 0.75,
  match_count        INTEGER DEFAULT 10
)
RETURNS TABLE (
  id            UUID,
  source_type   TEXT,
  source_id     UUID,
  content_chunk TEXT,
  similarity    FLOAT,
  metadata      JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    le.id,
    le.source_type,
    le.source_id,
    le.content_chunk,
    1 - (le.embedding <=> query_embedding) AS similarity,
    le.metadata
  FROM public.law_embeddings le
  WHERE
    (source_type_filter IS NULL OR le.source_type = source_type_filter)
    AND 1 - (le.embedding <=> query_embedding) > match_threshold
  ORDER BY le.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA — Hukuk Alanları (14 alan)
-- ============================================================
INSERT INTO public.law_areas (name, slug, icon, description, sort_order) VALUES
  ('Ceza Hukuku',          'ceza',          'gavel',      'Suç ve ceza yargılamaları',             1),
  ('Aile Hukuku',          'aile',          'heart',      'Boşanma, velayet, nafaka',              2),
  ('İş Hukuku',            'is',            'briefcase',  'İşçi-işveren uyuşmazlıkları',          3),
  ('Ticaret Hukuku',       'ticaret',       'building',   'Şirketler, sözleşmeler, iflas',         4),
  ('Miras Hukuku',         'miras',         'scroll',     'Vasiyet, veraset, taksim',              5),
  ('Gayrimenkul Hukuku',   'gayrimenkul',   'home',       'Tapu, kira, imar uyuşmazlıkları',       6),
  ('Tüketici Hukuku',      'tuketici',      'shopping-bag','Tüketici hakları ve şikayetler',       7),
  ('İdare Hukuku',         'idare',         'landmark',   'Devlet ve idari uyuşmazlıklar',         8),
  ('Vergi Hukuku',         'vergi',         'receipt',    'Vergi itirazları ve uyuşmazlıklar',     9),
  ('Sigorta Hukuku',       'sigorta',       'shield',     'Sigorta poliçe ve tazminat davalar',   10),
  ('Fikri Mülkiyet',       'fikri-mulkiyet','lightbulb',  'Patent, marka, telif hakkı',            11),
  ('Sağlık Hukuku',        'saglik',        'activity',   'Tıbbi malpraktis, hasta hakları',       12),
  ('Çevre Hukuku',         'cevre',         'leaf',       'Çevresel düzenlemeler ve uyuşmazlıklar',13),
  ('Anayasa Hukuku',       'anayasa',       'book-open',  'Temel haklar ve anayasal uyuşmazlıklar',14)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA — Kredi Paketleri
-- ============================================================
INSERT INTO public.credit_packages (name, credits, price_try, is_popular) VALUES
  ('Başlangıç', 50,  49.00,  false),
  ('Popüler',   150, 129.00, true),
  ('Pro',       500, 379.00, false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA — Abonelik Planları
-- ============================================================
INSERT INTO public.subscription_plans (name, slug, price_monthly, price_yearly, features) VALUES
  (
    'Başlangıç', 'baslangic', 599.00, 5750.00,
    '["AI asistan", "Emsal arama", "Belge analizi (10/ay)", "Dilekçe üretimi (5/ay)"]'::jsonb
  ),
  (
    'Profesyonel', 'profesyonel', 1299.00, 12470.00,
    '["Sınırsız AI asistan", "Sınırsız emsal arama", "Sınırsız belge analizi", "CRM müvekkil yönetimi", "Dava dosya takibi", "Akıllı takvim", "Finans takibi"]'::jsonb
  ),
  (
    'Büro', 'buro', 2999.00, 28790.00,
    '["Profesyonel planın tümü", "UYAP entegrasyonu", "UETS e-tebligat", "Çoklu kullanıcı (5 hesap)", "Öncelikli destek", "Özel onboarding"]'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;
