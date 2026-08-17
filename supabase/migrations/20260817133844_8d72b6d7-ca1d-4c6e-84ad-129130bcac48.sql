CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'page_view',
  path text,
  label text,
  detail jsonb,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.user_activity TO authenticated;
GRANT ALL ON public.user_activity TO service_role;

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own activity"
ON public.user_activity FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own activity or admin views all"
ON public.user_activity FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_user_activity_user_created ON public.user_activity (user_id, created_at DESC);
CREATE INDEX idx_user_activity_created ON public.user_activity (created_at DESC);