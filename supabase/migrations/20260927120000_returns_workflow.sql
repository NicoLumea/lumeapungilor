-- Complete, additive returns / product-complaint workflow.
-- Apply this migration through the normal Supabase deployment process before deploying the UI.

alter table public.return_requests
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists reason text,
  add column if not exists submitted_at timestamptz not null default now(),
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists refund_processed_at timestamptz,
  add column if not exists idempotency_key uuid;

update public.return_requests
set status = case status
  when 'nou' then 'submitted'
  when 'in_lucru' then 'under_review'
  when 'rezolvat' then 'closed'
  when 'respins' then 'rejected'
  else status
end;

update public.return_requests
set status = 'submitted'
where status not in ('submitted','under_review','approved','rejected','awaiting_return','return_received','refund_pending','refunded','closed');

create unique index if not exists return_requests_idempotency_key_idx
  on public.return_requests (idempotency_key)
  where idempotency_key is not null;
create index if not exists return_requests_order_id_idx on public.return_requests (order_id);
create index if not exists return_requests_user_id_idx on public.return_requests (user_id);

alter table public.return_requests drop constraint if exists return_requests_status_check;
alter table public.return_requests add constraint return_requests_status_check check (
  status in ('submitted','under_review','approved','rejected','awaiting_return','return_received','refund_pending','refunded','closed')
);
alter table public.return_requests drop constraint if exists return_requests_reason_check;
alter table public.return_requests add constraint return_requests_reason_check check (
  reason is null or reason in ('damaged','wrong_product','wrong_quantity','incomplete','not_as_ordered','other')
);

create table if not exists public.return_request_items (
  id uuid primary key default gen_random_uuid(),
  return_request_id uuid not null references public.return_requests(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  product_name text not null,
  variant_name text,
  purchased_quantity integer not null check (purchased_quantity > 0),
  requested_quantity integer not null check (requested_quantity > 0 and requested_quantity <= purchased_quantity),
  created_at timestamptz not null default now(),
  unique (return_request_id, order_item_id)
);

create table if not exists public.return_request_images (
  id uuid primary key default gen_random_uuid(),
  return_request_id uuid not null references public.return_requests(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now()
);

create table if not exists public.guest_return_sessions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.guest_return_sessions is
  'Server-only short-lived proof that a guest supplied the matching order number and e-mail.';
create index if not exists guest_return_sessions_expiry_idx on public.guest_return_sessions (expires_at);

grant select on public.return_request_items, public.return_request_images to authenticated;
grant update on public.return_requests to authenticated;
grant all on public.return_request_items, public.return_request_images, public.guest_return_sessions to service_role;
alter table public.return_request_items enable row level security;
alter table public.return_request_images enable row level security;
alter table public.guest_return_sessions enable row level security;

drop policy if exists "owners read return items" on public.return_request_items;
create policy "owners read return items" on public.return_request_items for select to authenticated using (
  exists (select 1 from public.return_requests r where r.id = return_request_id and r.user_id = auth.uid())
);
drop policy if exists "staff read return items" on public.return_request_items;
create policy "staff read return items" on public.return_request_items for select to authenticated using (public.is_staff());

drop policy if exists "owners read return image metadata" on public.return_request_images;
create policy "owners read return image metadata" on public.return_request_images for select to authenticated using (
  exists (select 1 from public.return_requests r where r.id = return_request_id and r.user_id = auth.uid())
);
drop policy if exists "staff read return image metadata" on public.return_request_images;
create policy "staff read return image metadata" on public.return_request_images for select to authenticated using (public.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('return-evidence', 'return-evidence', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "return owners read evidence" on storage.objects;
create policy "return owners read evidence" on storage.objects for select to authenticated using (
  bucket_id = 'return-evidence' and exists (
    select 1 from public.return_requests r
    where r.id::text = (storage.foldername(name))[1] and r.user_id = auth.uid()
  )
);
drop policy if exists "staff read return evidence" on storage.objects;
create policy "staff read return evidence" on storage.objects for select to authenticated using (
  bucket_id = 'return-evidence' and public.is_staff()
);

create or replace function public.set_return_status_timestamps()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'under_review' and new.reviewed_at is null then new.reviewed_at = now(); end if;
    if new.status = 'approved' and new.approved_at is null then new.approved_at = now(); end if;
    if new.status = 'refunded' and new.refund_processed_at is null then new.refund_processed_at = now(); end if;
  end if;
  return new;
end; $$;

drop trigger if exists return_status_timestamps on public.return_requests;
create trigger return_status_timestamps before update on public.return_requests
for each row execute function public.set_return_status_timestamps();
