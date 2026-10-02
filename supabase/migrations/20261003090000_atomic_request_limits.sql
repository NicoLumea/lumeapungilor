-- Additive: deploy before the new limiter. Old code can use rate_limits unchanged.
create or replace function public.consume_request_rate_limit(
  p_bucket text, p_identifier_hash text, p_ip_hash text,
  p_limit integer, p_ip_limit integer, p_window_seconds integer
) returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
declare
  target_bucket text;
  target_hash text;
  target_limit integer;
  consumed integer;
  stamp timestamptz := statement_timestamp();
begin
  if p_bucket is null or length(p_bucket) not between 1 and 80
    or p_identifier_hash is null or p_identifier_hash !~ '^[a-f0-9]{64}$'
    or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$'
    or p_limit is null or p_limit not between 1 and 10000
    or p_ip_limit is null or p_ip_limit not between 1 and 10000
    or p_window_seconds is null or p_window_seconds not between 1 and 86400 then
    raise exception 'INVALID_RATE_LIMIT_CONFIGURATION' using errcode = '22023';
  end if;
  -- IP first: blocked clients cannot create unbounded identifier buckets.
  -- UPSERT locks each counter, so simultaneous requests cannot lose increments.
  for target_bucket, target_hash, target_limit in
    select * from (values
      (p_bucket || ':ip', p_ip_hash, p_ip_limit),
      (p_bucket || ':identity', p_identifier_hash, p_limit)
    ) as limits(bucket_name, key_hash, max_hits)
  loop
    insert into public.rate_limits as counter (bucket, identifier, window_start, hits)
    values (target_bucket, target_hash, stamp, 1)
    on conflict (bucket, identifier) do update set
      hits = case
        when counter.window_start + make_interval(secs => p_window_seconds) <= stamp then 1
        else least(counter.hits + 1, target_limit + 1)
      end,
      window_start = case
        when counter.window_start + make_interval(secs => p_window_seconds) <= stamp then stamp
        else counter.window_start
      end
    returning hits into consumed;
    if consumed > target_limit then return jsonb_build_object('allowed', false); end if;
  end loop;
  return jsonb_build_object('allowed', true);
end;
$$;
revoke all on function public.consume_request_rate_limit(text,text,text,integer,integer,integer)
  from public, anon, authenticated;
grant execute on function public.consume_request_rate_limit(text,text,text,integer,integer,integer)
  to service_role;
comment on function public.consume_request_rate_limit(text,text,text,integer,integer,integer)
  is 'Atomic trusted-IP and identifier budgets. Server-only HMAC keys; no raw email or IP.';
