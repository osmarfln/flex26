CREATE TABLE IF NOT EXISTS public.mega_sena_results (
  concurso INTEGER PRIMARY KEY,
  data_apuracao DATE NOT NULL,
  dezenas SMALLINT[] NOT NULL,
  dezenas_ordem_sorteio SMALLINT[],
  acumulou BOOLEAN NOT NULL DEFAULT false,
  local_sorteio TEXT,
  municipio_uf TEXT,
  valor_arrecadado NUMERIC,
  valor_acumulado NUMERIC,
  valor_estimado_proximo NUMERIC,
  data_proximo_concurso DATE,
  proximo_concurso INTEGER,
  rateio JSONB,
  ganhadores_sena INTEGER,
  premio_sena NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mega_sena_results_data_idx ON public.mega_sena_results (data_apuracao DESC);

GRANT SELECT ON public.mega_sena_results TO anon;
GRANT SELECT ON public.mega_sena_results TO authenticated;
GRANT ALL ON public.mega_sena_results TO service_role;

ALTER TABLE public.mega_sena_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mega-Sena results are public" ON public.mega_sena_results;
CREATE POLICY "Mega-Sena results are public" ON public.mega_sena_results FOR SELECT USING (true);