-- Keep the editable privacy-page introduction concise; the audited structured
-- sections are rendered by the existing ContentPage route.
insert into public.site_content (key, value)
values (
  'privacy',
  jsonb_build_object(
    'title', 'Politica de confidențialitate',
    'body', 'Protecția datelor cu caracter personal este importantă pentru Lumea Pungilor. Prezenta politică explică ce date putem prelucra atunci când utilizezi site-ul, scopurile pentru care sunt utilizate, temeiurile prelucrării și drepturile de care beneficiezi.'
  )
)
on conflict (key) do update
set value = coalesce(public.site_content.value, '{}'::jsonb) || jsonb_build_object(
  'title', 'Politica de confidențialitate',
  'body', 'Protecția datelor cu caracter personal este importantă pentru Lumea Pungilor. Prezenta politică explică ce date putem prelucra atunci când utilizezi site-ul, scopurile pentru care sunt utilizate, temeiurile prelucrării și drepturile de care beneficiezi.'
), updated_at = now();
