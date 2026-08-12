CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'sync-lottery-results-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--d134319b-abef-4658-ac0d-1b975d90c6a0.lovable.app/api/public/sync-results',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_FcmFOWVTb87n_bf7jPADxQ_1_JWXC-o"}'::jsonb,
    body := '{"daysToSync": 1}'::jsonb
  ) as request_id;
  $$
);
