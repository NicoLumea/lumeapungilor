-- Give misleading or unwieldy product URLs concise, unique slugs. Published
-- URL changes are captured as permanent redirects by the existing SEO trigger.
-- This migration does not change product descriptions, prices, or SEO fields.
begin;

create temporary table product_slug_cleanup (
  old_slug text primary key,
  new_slug text not null unique,
  expected_name text not null
) on commit drop;

insert into product_slug_cleanup (old_slug, new_slug, expected_name) values
  ('punga-maci-fara-maner-40x50', 'punga-floarea-soarelui-40x50', 'Pungi cu imprimeu floarea-soarelui 40 × 50 cm – mâner cu buclă'),
  ('maci-fara-maner-40-50', 'punga-maci-40x50-maner-decupat', 'Pungi cu imprimeu maci 40 × 50 cm – mâner decupat'),
  ('punga-paste-fara-maner-40x50', 'punga-paste-40x50-maner-decupat', 'Pungi de Paște 40 × 50 cm – mâner decupat'),
  ('punga-paste-cu-maner-40x50', 'punga-paste-40x50-maner-bucla', 'Pungi de Paște 40 × 50 cm – mâner cu buclă'),
  ('punga-din-polietilena-cu-imprimeu-thank-you-40-50-cm', 'punga-thank-you-40x50', 'Pungi „Thank You” 40 × 50 cm – mâner cu buclă'),
  ('punga-din-polietilena-cu-imprimeu-leopard-30-40-cm', 'punga-leopard-30x40', 'Pungi cu imprimeu leopard 30 × 40 cm – mâner cu buclă'),
  ('punga-din-polietilena-cu-model-traditional-romanesc-25-30-cm', 'punga-traditional-romanesc-25x30-model-2', 'Pungi cu model tradițional românesc – model 2 – 25 × 30 cm – mâner decupat'),
  ('punga-mini-ykr-15-20-cm', 'punga-mini-ykr-15x20', 'Pungi mini YKR 15 × 20 cm – mâner decupat'),
  ('punga-lamai', 'punga-lamai-36x36', 'Pungi cu imprimeu lămâi 36 x 36 – mâner cu buclă'),
  ('punga-oras', 'punga-urban-40x50', 'Pungi cu imprimeu urban 40 x 50– mâner decupat'),
  ('punga-floral-maner-bucla-40x50', 'punga-florala-40x50-model-2', 'Pungi cu imprimeu floral – model 2 – 40 × 50 cm – mâner cu buclă'),
  ('punga-floral-40x50', 'punga-florala-40x50-model-3', 'Pungi cu imprimeu floral – model 3 – 40 × 50 cm – mâner cu buclă'),
  ('pungi-curierat-35-55', 'punga-curierat-35x55', 'Pungi de curierat 35 × 55 cm'),
  ('fata-de-masa-model-cu-fructe', 'musama-cirese-frunze-1-4x50m', 'Mușama cu model cireșe și frunze – 1,4 × 50 m'),
  ('fata-de-masa-model-de-flori', 'musama-florala-1-4x50m', 'Mușama cu model floral  – 1,4 × 50 m'),
  ('fata-de-masa-model-flori', 'musama-flori-de-camp-1-4x50m', 'Mușama cu model flori de câmp – 1,4 × 50 m'),
  ('fata-de-masa-model-fructe', 'musama-fructe-1-4x50m', 'Mușama cu model fructe – 1,4 × 50 m'),
  ('musama-model-cirese-1-4-x-50-metri', 'musama-cirese-1-4x50m', 'Mușama cu cireșe – 1,4 × 50 m'),
  ('musama-bej-cu-medalioane-florale-1-4-x-50-metri', 'musama-bej-medalioane-florale-1-4x50m', 'Mușama bej cu medalioane florale – 1,4 × 50 m'),
  ('musama-model-alb-cu-flori-albastre-si-mov', 'musama-alba-flori-albastre-mov-1-4x50m', 'Mușama albă cu flori albastre și mov – 1,4 × 50 m');

do $$
declare
  expected_count integer;
begin
  select count(*) into expected_count from product_slug_cleanup;
  if expected_count <> 20 then
    raise exception 'Expected 20 product URL changes, found %', expected_count;
  end if;
  if exists (
    select 1 from product_slug_cleanup
    where new_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or old_slug = new_slug
  ) then
    raise exception 'Product URL cleanup contains an invalid slug';
  end if;
  if exists (
    select 1 from product_slug_cleanup c
    left join public.products p on p.slug = c.old_slug
    where p.id is null or p.status <> 'published' or p.name <> c.expected_name
  ) then
    raise exception 'Product URL cleanup source product changed; review mappings';
  end if;
  if exists (
    select 1 from product_slug_cleanup c
    join public.products p on p.slug = c.new_slug
  ) then
    raise exception 'Product URL cleanup target slug already belongs to a product';
  end if;
  if exists (
    select 1 from product_slug_cleanup c
    join public.seo_redirects r on r.from_path = '/produs/' || c.new_slug
  ) then
    raise exception 'Product URL cleanup target is already an old redirect source';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.products'::regclass
      and tgname = 'products_capture_seo_slug_redirect'
      and tgenabled <> 'D'
  ) then
    raise exception 'SEO slug redirect trigger must be enabled before product URL cleanup';
  end if;
end;
$$;

-- These two displayed names disagree with their SKU, old description, and
-- existing SEO fields. The revised descriptions already use the same facts.
update public.products
set name = 'Pungi cu imprimeu lalele 30 × 40 cm – mâner cu buclă'
where slug = 'punga-lalele-30x40'
  and name = 'Pungi cu imprimeu trandafiri 30 × 40 cm – mâner cu buclă';

update public.products
set name = 'Pungi de curierat 50 × 65 cm'
where slug = 'punga-curierat-50x65'
  and name = 'Pungi de curierat 50 × 60 cm';

do $$
begin
  if not exists (
    select 1 from public.products
    where slug = 'punga-lalele-30x40'
      and name = 'Pungi cu imprimeu lalele 30 × 40 cm – mâner cu buclă'
  ) or not exists (
    select 1 from public.products
    where slug = 'punga-curierat-50x65'
      and name = 'Pungi de curierat 50 × 65 cm'
  ) then
    raise exception 'Product name correction could not be verified';
  end if;
end;
$$;

update public.products p
set slug = c.new_slug
from product_slug_cleanup c
where p.slug = c.old_slug;

do $$
begin
  if exists (
    select 1 from product_slug_cleanup c
    left join public.products p on p.slug = c.new_slug
    left join public.seo_redirects r on r.from_path = '/produs/' || c.old_slug
    where p.id is null
      or r.to_path is distinct from '/produs/' || c.new_slug
      or r.entity_id is distinct from p.id
  ) then
    raise exception 'Product URL cleanup or permanent redirects were not applied completely';
  end if;
end;
$$;

commit;
