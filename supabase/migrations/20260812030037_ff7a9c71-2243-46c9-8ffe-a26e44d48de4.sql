-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.lottery_results;
DROP POLICY IF EXISTS "Enable upsert for authenticated users" ON public.lottery_results;

-- Create policies that allow the sync worker (using the anon/authenticated key) to upsert
CREATE POLICY "Allow authenticated upsert on lottery_results" 
ON public.lottery_results 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow anon upsert on lottery_results" 
ON public.lottery_results 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Ensure grants are correct for all roles
GRANT ALL ON public.lottery_results TO authenticated;
GRANT ALL ON public.lottery_results TO anon;
GRANT ALL ON public.lottery_results TO service_role;
