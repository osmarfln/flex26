-- Create lottery_results table
CREATE TABLE public.lottery_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    time_type TEXT NOT NULL, -- PTM, PT, PTV, PTN, Corujinha, PPT
    time_value TEXT,         -- 11:20, 14:20, etc.
    results TEXT[] NOT NULL,  -- Array of numbers (usually 5 to 7)
    animal TEXT,
    animal_group TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(date, time_type)
);

-- Indexes for performance
CREATE INDEX idx_lottery_results_date ON public.lottery_results(date DESC);
CREATE INDEX idx_lottery_results_time_type ON public.lottery_results(time_type);

-- Enable RLS
ALTER TABLE public.lottery_results ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.lottery_results TO anon;
GRANT SELECT ON public.lottery_results TO authenticated;
GRANT ALL ON public.lottery_results TO service_role;

-- Policies
CREATE POLICY "Allow public read access" ON public.lottery_results
    FOR SELECT USING (true);

CREATE POLICY "Allow service_role full access" ON public.lottery_results
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Table for sync logs
CREATE TABLE public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL, -- success, error
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    date_range_start DATE,
    date_range_end DATE
);

GRANT SELECT ON public.sync_logs TO authenticated;
GRANT ALL ON public.sync_logs TO service_role;

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs" ON public.sync_logs
    FOR SELECT TO authenticated USING (true);
