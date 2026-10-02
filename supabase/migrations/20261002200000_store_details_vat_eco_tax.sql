-- Presentation-only classification: NULL means unconfirmed, never infer from a bag name/category.
alter table public.products add column if not exists eco_tax_applicable boolean;
comment on column public.products.eco_tax_applicable is
  'Confirmed eco-tax applicability for the product and all variants; NULL = unconfirmed. Display only; does not alter prices or totals.';

-- Patch confirmed company fields while preserving unrelated CMS/Lovable edits.
insert into public.site_content(key, value)
values ('company', '{"name":"Lumea Pungilor","brand_name":"Lumea Pungilor","website":"https://lumeapungilor.ro","legal_company_name":"DEKORAMA IMPORT SRL","address":"Str. Agricultori nr. 88, Buftea, județul Ilfov, România","registered_address":"Str. Agricultori nr. 88, Buftea, județul Ilfov, România","returns_address":"Str. Dragonul Roșu nr. 1-10, sat Fundeni, comuna Dobroești, județul Ilfov, cod poștal 077086, România","cui":"RO38393721","reg_com":"J2017005349230","trade_register_number":"J2017005349230","vat_registered":true,"email":"contact@lumeapungilor.ro","phone":"0754 039 462","phone_primary":"0754 039 462","phone_secondary":null,"secondary_phone_note":null,"operating_days":"Luni–Vineri","operating_hours":"07:00–15:00"}'::jsonb)
on conflict (key) do update set value = public.site_content.value || excluded.value;

-- Replace only the known placeholders, preserving all other legal copy.
do $$
declare
  body text;
  replacement record;
begin
  select coalesce(value->>'body', '') into body from public.site_content where key = 'terms';
  body := coalesce(body, '');
  for replacement in select * from (values
    ('[DE COMPLETAT: DOMENIUL WEBSITE-ULUI]', 'lumeapungilor.ro'),
    ('[DE COMPLETAT: DOMENIU]', 'lumeapungilor.ro'),
    ('[DE COMPLETAT: denumirea juridică integrală a societății și forma juridică]', 'DEKORAMA IMPORT SRL'),
    ('[DE COMPLETAT: sediul social complet]', 'Sediu social: Str. Agricultori nr. 88, Buftea, județul Ilfov, România'),
    ('[DE COMPLETAT: CUI/CIF]', 'CUI: RO38393721'),
    ('[DE COMPLETAT: numărul de ordine în Registrul Comerțului]', 'Registrul Comerțului: J2017005349230'),
    ('[DE COMPLETAT: statutul de plătitor de TVA și codul de TVA, dacă este cazul]', 'Societatea este plătitoare de TVA. Cod TVA: RO38393721.'),
    ('[DE COMPLETAT: adresa de e-mail pentru clienți]', 'contact@lumeapungilor.ro'),
    ('[DE COMPLETAT: numărul de telefon pentru clienți]', '0754 039 462'),
    ('[DE COMPLETAT: adresa pentru retururi și reclamații, dacă diferă de sediul social]', 'Adresă pentru retururi: Str. Dragonul Roșu nr. 1-10, sat Fundeni, comuna Dobroești, județul Ilfov, cod poștal 077086, România'),
    ('[DE COMPLETAT: programul serviciului pentru clienți]', 'Luni–Vineri, 07:00–15:00'),
    ('[DE COMPLETAT: dacă prețurile pentru consumatori includ TVA și cum sunt afișate prețurile pentru clienții B2B]', 'Prețurile afișate pe website sunt exprimate în lei și includ TVA.

Pentru produsele supuse ecotaxei, aceasta este inclusă în prețul afișat.'),
    ('[DE COMPLETAT: adresa de e-mail, formularul online sau adresa poștală pentru notificarea retragerii]', 'contact@lumeapungilor.ro'),
    ('[DE COMPLETAT: adresa exactă la care se returnează produsele]', 'Str. Dragonul Roșu nr. 1-10, sat Fundeni, comuna Dobroești, județul Ilfov, cod poștal 077086, România'),
    ('[DE COMPLETAT: E-MAIL RECLAMAȚII]', 'contact@lumeapungilor.ro'),
    ('[DE COMPLETAT: e-mail]', 'contact@lumeapungilor.ro'),
    ('[DE COMPLETAT: telefon și program]', '0754 039 462, Luni–Vineri, 07:00–15:00'),
    ('[DE COMPLETAT: adresă poștală]', 'Str. Agricultori nr. 88, Buftea, județul Ilfov, România'),
    ('[DE COMPLETAT: DENUMIREA VÂNZĂTORULUI, ADRESA, E-MAILUL]', 'DEKORAMA IMPORT SRL; sediu social: Str. Agricultori nr. 88, Buftea, județul Ilfov, România; contact@lumeapungilor.ro; adresă pentru retururi: Str. Dragonul Roșu nr. 1-10, sat Fundeni, comuna Dobroești, județul Ilfov, cod poștal 077086, România')
  ) as replacements(old_text, new_text)
  loop
    body := replace(body, replacement.old_text, replacement.new_text);
  end loop;
  if position('Prețurile afișate pe website sunt exprimate în lei și includ TVA.' in body) = 0 then
    body := body || E'\n\n' || 'Prețurile afișate pe website sunt exprimate în lei și includ TVA.';
  end if;
  if position('Pentru produsele supuse ecotaxei, aceasta este inclusă în prețul afișat.' in body) = 0 then
    body := body || E'\n\n' || 'Pentru produsele supuse ecotaxei, aceasta este inclusă în prețul afișat.';
  end if;
  insert into public.site_content(key, value)
  values ('terms', jsonb_build_object('title', 'Termeni și condiții', 'body', body))
  on conflict (key) do update set value = public.site_content.value || jsonb_build_object('body', body);
end;
$$;

-- Exact correction of the observed About copy; do not overwrite future content edits.
update public.site_content
set value = jsonb_set(value, '{body}', to_jsonb(replace(value->>'body', 'între 09:00 și 17:00', 'între 07:00 și 15:00')))
where key = 'about' and value->>'body' like '%între 09:00 și 17:00%';
