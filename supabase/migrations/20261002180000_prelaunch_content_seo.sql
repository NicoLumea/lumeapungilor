-- Additive pre-launch SEO/content fields. Existing descriptions and site_content JSON are kept.
alter table public.categories
  add column if not exists intro_text text,
  add column if not exists body_text text,
  add column if not exists meta_title text,
  add column if not exists meta_description text;

alter table public.products
  add column if not exists meta_title text,
  add column if not exists meta_description text;

create table if not exists public.seo_redirects (
  from_path text primary key,
  to_path text not null,
  entity_type text check (entity_type in ('product', 'category')),
  entity_id uuid,
  created_at timestamptz not null default now(),
  constraint seo_redirects_distinct_paths check (from_path <> to_path),
  constraint seo_redirects_local_paths check (
    from_path ~ '^/(produs|categorie)/[a-z0-9][a-z0-9-]*$'
    and to_path ~ '^/(produs|categorie)/[a-z0-9][a-z0-9-]*$'
  )
);

grant select on public.seo_redirects to anon, authenticated;
grant insert, update, delete on public.seo_redirects to authenticated;
grant all on public.seo_redirects to service_role;
alter table public.seo_redirects enable row level security;

drop policy if exists "public reads safe seo redirects" on public.seo_redirects;
create policy "public reads safe seo redirects"
  on public.seo_redirects for select to anon, authenticated using (true);

drop policy if exists "admins manage seo redirects" on public.seo_redirects;
create policy "admins manage seo redirects"
  on public.seo_redirects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create index if not exists seo_redirects_to_path_idx on public.seo_redirects(to_path);

create or replace function public.capture_seo_slug_redirect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text;
  old_path text;
  new_path text;
  kind text;
begin
  if old.slug is not distinct from new.slug then return new; end if;

  if tg_table_name = 'products' then
    if old.status <> 'published' then return new; end if;
    prefix := '/produs/';
    kind := 'product';
  elsif tg_table_name = 'categories' then
    if not old.is_visible then return new; end if;
    prefix := '/categorie/';
    kind := 'category';
  else
    return new;
  end if;

  old_path := prefix || trim(both '/' from old.slug);
  new_path := prefix || trim(both '/' from new.slug);
  if old_path = new_path then return new; end if;

  -- Point earlier aliases directly at the newest URL to avoid redirect chains.
  update public.seo_redirects set to_path = new_path where to_path = old_path;

  -- A destination may not resolve back to the source through an existing chain.
  if exists (
    with recursive chain(path) as (
      select new_path
      union all
      select r.to_path from public.seo_redirects r join chain c on r.from_path = c.path
    )
    select 1 from chain where path = old_path
  ) then
    raise exception 'SEO redirect loop rejected: % -> %', old_path, new_path;
  end if;

  insert into public.seo_redirects(from_path, to_path, entity_type, entity_id)
  values (old_path, new_path, kind, new.id)
  on conflict (from_path) do update
    set to_path = excluded.to_path,
        entity_type = excluded.entity_type,
        entity_id = excluded.entity_id,
        created_at = now();
  return new;
end;
$$;

revoke all on function public.capture_seo_slug_redirect() from public, anon, authenticated;

drop trigger if exists products_capture_seo_slug_redirect on public.products;
create trigger products_capture_seo_slug_redirect
  before update of slug on public.products
  for each row execute function public.capture_seo_slug_redirect();

drop trigger if exists categories_capture_seo_slug_redirect on public.categories;
create trigger categories_capture_seo_slug_redirect
  before update of slug on public.categories
  for each row execute function public.capture_seo_slug_redirect();

-- Preserve both historical field names without overwriting populated content.
update public.site_content
set value = value
  || case when coalesce(value->>'hero_text', '') <> '' and coalesce(value->>'hero_subtitle', '') = ''
       then jsonb_build_object('hero_subtitle', value->>'hero_text') else '{}'::jsonb end
  || case when coalesce(value->>'editorial_text', '') <> '' and coalesce(value->>'editorial_body', '') = ''
       then jsonb_build_object('editorial_body', value->>'editorial_text') else '{}'::jsonb end
where key = 'home';

insert into public.site_content(key, value)
values ('seo', '{"google_site_verification":null,"default_social_image_url":null}'::jsonb)
on conflict (key) do nothing;
