
-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;

-- Generate and store a random CRON_SECRET in vault (only if missing)
do $$
declare
  v_exists boolean;
begin
  select exists(select 1 from vault.secrets where name = 'CRON_SECRET') into v_exists;
  if not v_exists then
    perform vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'CRON_SECRET');
  end if;
end $$;

-- Security-definer RPC the edge function uses to verify the cron token
create or replace function public.verify_cron_secret(_token text)
returns boolean
language sql
stable
security definer
set search_path = public, vault
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'CRON_SECRET' and decrypted_secret = _token
  );
$$;

revoke all on function public.verify_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_cron_secret(text) to service_role;

-- Helper to read the cron secret inside cron jobs (security definer, restricted)
create or replace function public.get_cron_secret()
returns text
language sql
stable
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET' limit 1;
$$;
revoke all on function public.get_cron_secret() from public, anon, authenticated;

-- Remove old cron jobs that used anon JWT (which fails admin check)
do $$
declare j record;
begin
  for j in select jobname from cron.job
           where jobname in (
             'daily-scheme-sync',
             'sync-schemes-daily-6am-ist',
             'sync-karnataka-private-jobs-daily',
             'daily-karnataka-all-categories',
             'daily-karnataka-private-jobs'
           )
  loop
    perform cron.unschedule(j.jobname);
  end loop;
end $$;

-- Daily Karnataka per-category top-up (every day 06:00 IST = 00:30 UTC)
select cron.schedule(
  'daily-karnataka-all-categories',
  '30 0 * * *',
  $$
  select net.http_post(
    url := 'https://bhfjlxizuwwzvhdzpoxs.supabase.co/functions/v1/sync-schemes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', public.get_cron_secret()
    ),
    body := '{"state":"karnataka","mode":"sync"}'::jsonb
  );
  $$
);

-- Daily Karnataka private jobs refresh (06:15 IST)
select cron.schedule(
  'daily-karnataka-private-jobs',
  '45 0 * * *',
  $$
  select net.http_post(
    url := 'https://bhfjlxizuwwzvhdzpoxs.supabase.co/functions/v1/sync-schemes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', public.get_cron_secret()
    ),
    body := '{"state":"karnataka","focus":"private_jobs"}'::jsonb
  );
  $$
);
