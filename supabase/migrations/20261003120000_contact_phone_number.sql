-- Correct only the primary store contact number in an existing Lovable database.
-- Preserve all other company settings, including the secondary phone.
insert into public.site_content (key, value)
values (
  'company',
  jsonb_build_object('phone', '0765 514 422', 'phone_primary', '0765 514 422')
)
on conflict (key) do update
set value = coalesce(public.site_content.value, '{}'::jsonb) || excluded.value;
