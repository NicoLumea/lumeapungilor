-- Staff access is now granted directly by administrators through the server.
-- Keep historical requests readable; customers can no longer submit via REST.
begin;
drop policy if exists "own employee request insert" on public.employee_requests;
revoke insert, update, delete on public.employee_requests from anon, authenticated;
revoke insert, update, delete on public.role_change_requests from anon, authenticated;
commit;
