-- Use customer-facing category slugs without changing names, headings, or SEO copy.
-- The existing category trigger records 301 redirects for both old URLs.
begin;

do $$
declare
  v_plastic uuid;
  v_small uuid;
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.categories'::regclass
      and tgname = 'categories_capture_seo_slug_redirect'
      and tgenabled <> 'D'
  ) then
    raise exception 'Category SEO redirect trigger must be enabled';
  end if;

  if exists (select 1 from public.categories where slug = 'pungute-plastic') then
    if exists (select 1 from public.categories where slug = 'pungi-plastic') then
      raise exception 'Both old and new plastic-bag slugs exist';
    end if;
    update public.categories
       set slug = 'pungi-plastic'
     where slug = 'pungute-plastic' and name = 'Pungi Plastic';
    if not found then raise exception 'Plastic-bag category name changed'; end if;
  end if;

  if exists (select 1 from public.categories where slug = 'pungi-mici') then
    if exists (select 1 from public.categories where slug = 'pungute-mici') then
      raise exception 'Both old and new small-bag slugs exist';
    end if;
    update public.categories
       set slug = 'pungute-mici'
     where slug = 'pungi-mici' and name = 'Pungute Mici';
    if not found then raise exception 'Small-bag category name changed'; end if;
  end if;

  select id into v_plastic from public.categories where slug = 'pungi-plastic';
  select id into v_small from public.categories where slug = 'pungute-mici';
  if v_plastic is null or v_small is null
     or exists (select 1 from public.categories where slug in ('pungute-plastic', 'pungi-mici')) then
    raise exception 'Category slug correction incomplete';
  end if;
  if not exists (
    select 1 from public.seo_redirects
    where from_path = '/categorie/pungute-plastic'
      and to_path = '/categorie/pungi-plastic'
      and entity_type = 'category' and entity_id = v_plastic
  ) or not exists (
    select 1 from public.seo_redirects
    where from_path = '/categorie/pungi-mici'
      and to_path = '/categorie/pungute-mici'
      and entity_type = 'category' and entity_id = v_small
  ) then
    raise exception 'Category redirects were not recorded';
  end if;
end;
$$;

commit;
