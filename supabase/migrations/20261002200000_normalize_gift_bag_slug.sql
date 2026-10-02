-- The public route already strips this legacy leading slash. Normalize only the
-- stored gift-bag slug so the admin UI and future edits use the canonical value.
do $$
begin
  if exists (select 1 from public.categories where slug = '/pungi-cadou')
     and exists (select 1 from public.categories where slug = 'pungi-cadou') then
    raise exception 'Cannot normalize gift-bag slug: pungi-cadou already exists';
  end if;
  update public.categories
     set slug = 'pungi-cadou'
   where slug = '/pungi-cadou';
end;
$$;
