-- Execute after the additive migration, inside a transaction that is rolled back.
-- Synthetic buckets only; no customer records, orders, or production budgets.
do $$
declare
  scope text := 'security-test-' || gen_random_uuid()::text;
  result jsonb;
begin
  if has_function_privilege('anon', 'public.consume_request_rate_limit(text,text,text,integer,integer,integer)', 'execute')
    or has_function_privilege('authenticated', 'public.consume_request_rate_limit(text,text,text,integer,integer,integer)', 'execute') then
    raise exception 'public access to limiter must be denied';
  end if;
  for i in 1..2 loop
    result := public.consume_request_rate_limit(scope, repeat('a',64), repeat('b',64), 2, 4, 60);
    if result->>'allowed' <> 'true' then raise exception 'request within budget rejected'; end if;
  end loop;
  result := public.consume_request_rate_limit(scope, repeat('a',64), repeat('b',64), 2, 4, 60);
  if result->>'allowed' <> 'false' then raise exception 'identifier limit bypass'; end if;
  result := public.consume_request_rate_limit(scope, repeat('c',64), repeat('b',64), 2, 4, 60);
  if result->>'allowed' <> 'true' then raise exception 'new identity within IP budget rejected'; end if;
  result := public.consume_request_rate_limit(scope, repeat('d',64), repeat('b',64), 2, 4, 60);
  if result->>'allowed' <> 'false' then raise exception 'rotating identity bypassed IP limit'; end if;
  if exists(select 1 from public.rate_limits where bucket=scope||':identity' and identifier=repeat('d',64)) then
    raise exception 'blocked IP created another identity bucket';
  end if;
  update public.rate_limits set window_start=now()-interval '2 minutes' where bucket like scope||':%';
  result := public.consume_request_rate_limit(scope, repeat('a',64), repeat('b',64), 2, 4, 60);
  if result->>'allowed' <> 'true' then raise exception 'expired window did not reset'; end if;
  begin
    perform public.consume_request_rate_limit(scope, 'invalid', repeat('b',64), 2, 4, 60);
    raise exception 'invalid configuration accepted';
  exception when invalid_parameter_value then null;
  end;
end;
$$;
select 'atomic request limit integration checks passed' as result;
