-- Apply with the new order UI, not while the old production admin still needs direct writes.
-- Both table and column privileges must be revoked to enforce the confirmation RPC.
revoke update on public.orders from authenticated;
revoke update(status,payment_status,internal_notes) on public.orders from authenticated;
