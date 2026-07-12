-- Yapılacaklar (görevler) — kalıcı saklama (idempotent)
CREATE TABLE IF NOT EXISTS public.todos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  done       BOOLEAN NOT NULL DEFAULT false,
  due_at     TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos_lawyer_only" ON public.todos;
CREATE POLICY "todos_lawyer_only" ON public.todos
  FOR ALL USING (auth.uid() = lawyer_id);

CREATE INDEX IF NOT EXISTS idx_todos_lawyer_id ON public.todos(lawyer_id);
