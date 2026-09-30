-- Keep new order images as historical snapshots. Older orders deliberately retain
-- a null image instead of showing a later catalogue image as if it were original.
alter table public.order_items add column if not exists product_image_url text;

create or replace function public.snapshot_order_item_image()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.product_image_url is null and new.product_id is not null then
    select image.url into new.product_image_url
    from public.product_images image
    where image.product_id = new.product_id
    order by image.is_primary desc, image.sort_order, image.created_at, image.id
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists order_item_image_snapshot on public.order_items;
create trigger order_item_image_snapshot before insert on public.order_items
  for each row execute function public.snapshot_order_item_image();

-- Only the server reads this hash. Putting it on orders would expose it through
-- the existing table-level SELECT grant, even with a column-level REVOKE.
create table if not exists public.guest_order_access (
  order_id uuid primary key references public.orders(id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.guest_order_access enable row level security;
revoke all on public.guest_order_access from public, anon, authenticated;
grant all on public.guest_order_access to service_role;

create table if not exists public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  feedback_type text not null check (feedback_type in ('website', 'product', 'experience')),
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  rating integer check (rating between 1 and 5),
  message text not null check (char_length(message) between 10 and 3000),
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_feedback_staff_queue_idx
  on public.customer_feedback (status, feedback_type, created_at desc);
create index if not exists customer_feedback_user_idx
  on public.customer_feedback (user_id, created_at desc) where user_id is not null;
grant select, update(status) on public.customer_feedback to authenticated;
grant all on public.customer_feedback to service_role;
alter table public.customer_feedback enable row level security;
create policy "customers read own feedback" on public.customer_feedback
  for select to authenticated using (user_id = auth.uid());
create policy "verified staff read feedback" on public.customer_feedback
  for select to authenticated using (public.is_staff());
create policy "verified staff update feedback" on public.customer_feedback
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create trigger customer_feedback_updated before update on public.customer_feedback
  for each row execute function public.set_updated_at();

comment on table public.customer_feedback is
  'Private feedback, separate from returns, complaints, and live support. Guest submissions use server-side validation and rate limiting.';
