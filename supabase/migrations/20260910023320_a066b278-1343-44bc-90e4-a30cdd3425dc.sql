CREATE TABLE public.bot_palpites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  location TEXT NOT NULL,
  target_date DATE NOT NULL,
  target_time_type TEXT NOT NULL,
  target_label TEXT,
  tens TEXT[] NOT NULL DEFAULT '{}',
  groups TEXT[] NOT NULL DEFAULT '{}',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_palpites TO authenticated;
GRANT ALL ON public.bot_palpites TO service_role;
ALTER TABLE public.bot_palpites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own palpites" ON public.bot_palpites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX bot_palpites_user_created_idx ON public.bot_palpites (user_id, created_at DESC);