-- Staff can record fulfillment directly when dispatch was handled outside the shop.
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
