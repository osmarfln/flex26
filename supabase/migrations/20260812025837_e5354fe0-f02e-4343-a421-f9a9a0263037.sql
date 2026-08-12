GRANT SELECT ON public.lottery_results TO anon;
GRANT SELECT ON public.lottery_results TO authenticated;
GRANT ALL ON public.lottery_results TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.sync_logs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.sync_logs TO authenticated;
GRANT ALL ON public.sync_logs TO service_role;

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon and auth to insert logs" ON public.sync_logs
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow anon and auth to update logs" ON public.sync_logs
FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Allow anyone to select logs" ON public.sync_logs
FOR SELECT TO anon, authenticated USING (true);
