-- Private documents and manual-email declarations. No email delivery claim is made.
create table if not exists public.order_legal_snapshots (
  order_id uuid primary key references public.orders(id) on delete cascade,
  terms text not null,
  captured_at timestamptz not null default now(),
  source text not null check (source in ('checkout', 'staff_legacy')),
  supplied_by uuid references auth.users(id)
);
alter table public.order_legal_snapshots enable row level security;
create table if not exists public.order_invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  storage_path text not null unique,
  invoice_number text not null check(length(invoice_number) between 1 and 100),
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.order_invoices enable row level security;
create table if not exists public.order_email_drafts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('acceptance','dispatch','invoice')),
  actor_id uuid not null references auth.users(id),
  actor_email text not null,
  order_version timestamptz not null,
  recipient text not null,
  subject text not null,
  body text not null,
  tracking text not null default '',
  invoice_id uuid references public.order_invoices(id),
  created_at timestamptz not null default now(),
  declared_sent_at timestamptz
);
alter table public.order_email_drafts enable row level security;
create index if not exists order_email_drafts_order_id_created_at_idx on public.order_email_drafts(order_id, created_at desc);
create index if not exists order_invoices_order_id_created_at_idx on public.order_invoices(order_id, created_at desc);
-- No browser access to private tables or storage. Server endpoints authorize each request.
revoke all on public.order_legal_snapshots, public.order_invoices, public.order_email_drafts from anon, authenticated;
grant all on public.order_legal_snapshots, public.order_invoices, public.order_email_drafts to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('order-invoices','order-invoices',false,10485760,array['application/pdf'])
on conflict(id) do nothing;

create or replace function public.capture_order_terms() returns trigger
language plpgsql security definer set search_path=public as $$
declare body text;
begin
  select value->>'body' into body from public.site_content where key='terms';
  if coalesce(length(trim(body)),0)>0 then
    insert into public.order_legal_snapshots(order_id,terms,source) values(new.id,body,'checkout');
  end if;
  return new;
end $$;
drop trigger if exists orders_capture_terms on public.orders;
create trigger orders_capture_terms after insert on public.orders
for each row execute function public.capture_order_terms();
revoke all on function public.capture_order_terms() from public;

-- Direct-write revocation is in the separate cutover migration, applied with the new UI.

create or replace function public.save_order_operations(
  p_id uuid, p_version timestamptz, p_status text, p_payment text,
  p_note text, p_draft uuid default null, p_confirmed boolean default false
) returns void language plpgsql security definer set search_path=public as $$
declare o public.orders; d public.order_email_drafts; required_kind text;
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into o from public.orders where id=p_id for update;
  if not found or o.updated_at is distinct from p_version then raise exception 'ORDER_CHANGED_RELOAD'; end if;
  if p_status is null or p_status not in ('nou','confirmat','in_livrare','finalizat','anulat')
    or p_payment is null or p_payment not in ('in_asteptare','platit','rambursat','anulat')
    or length(coalesce(p_note,''))>10000 then raise exception 'INVALID_INPUT'; end if;
  if p_status is distinct from o.status or p_draft is not null then
    if p_status='confirmat' then required_kind:='acceptance';
    elsif p_status='in_livrare' then required_kind:='dispatch';
    elsif p_status='finalizat' and o.status<>'in_livrare' then raise exception 'DISPATCH_REQUIRED';
    end if;
  end if;
  if required_kind='dispatch' and o.status not in ('confirmat','in_livrare') then raise exception 'ACCEPTANCE_REQUIRED'; end if;
  if required_kind is not null then
    select * into d from public.order_email_drafts where id=p_draft for update;
    if not found or p_confirmed is distinct from true or d.order_id<>o.id
      or d.actor_id<>auth.uid() or d.kind<>required_kind or d.order_version<>o.updated_at
      or d.declared_sent_at is not null or d.created_at < now()-interval '24 hours'
      then raise exception 'EMAIL_CONFIRMATION_REQUIRED'; end if;
    update public.order_email_drafts set declared_sent_at=now() where id=d.id;
    insert into public.audit_logs(actor_id,action,entity,entity_id,details)
      values(auth.uid(),'order.email_declared_sent','orders',o.id::text,jsonb_build_object('draft_id',d.id,'kind',d.kind));
  end if;
  update public.orders set status=p_status,payment_status=p_payment,internal_notes=p_note where id=o.id;
end $$;
revoke all on function public.save_order_operations(uuid,timestamptz,text,text,text,uuid,boolean) from public,anon;
grant execute on function public.save_order_operations(uuid,timestamptz,text,text,text,uuid,boolean) to authenticated;

create or replace function public.confirm_invoice_email(p_draft uuid) returns void
language plpgsql security definer set search_path=public as $$
declare d public.order_email_drafts;
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into d from public.order_email_drafts where id=p_draft for update;
  if not found or d.actor_id<>auth.uid() or d.kind<>'invoice' or d.invoice_id is null
    or d.declared_sent_at is not null or d.created_at < now()-interval '24 hours'
    then raise exception 'INVALID_DRAFT'; end if;
  update public.order_email_drafts set declared_sent_at=now() where id=d.id;
  insert into public.audit_logs(actor_id,action,entity,entity_id,details)
    values(auth.uid(),'order.email_declared_sent','orders',d.order_id::text,jsonb_build_object('draft_id',d.id,'kind',d.kind));
end $$;
revoke all on function public.confirm_invoice_email(uuid) from public,anon;
grant execute on function public.confirm_invoice_email(uuid) to authenticated;
