select cron.unschedule(1);
select cron.schedule(
  'sync-lottery-results',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://project--d134319b-abef-4658-ac0d-1b975d90c6a0-dev.lovable.app/api/public/sync-results',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"daysToSync": 2}'::jsonb
  );
  $$
);