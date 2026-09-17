# Roadmap — entry page + role-based accounts

1. [ ] DB: role enum (customer/employee/admin/owner), profiles, employee_requests, role_change_requests, guest_checkout_usage, return_requests, contact_requests, site_settings, content_sections, audit_logs, rate limits, RLS + grants + audit triggers
2. [ ] Server functions: signup/profile, guest one-order rule, employee request/approval, admin promotion with owner secret, audit writes, hardened checkout, order lookup
3. [ ] Entry page at `/`, store homepage moved to `/magazin`, links updated
4. [ ] Auth panel (login/register/reset), `/cont`, `/comenzile-mele`, `/retururi`, `/ajutor-comanda`
5. [ ] `/staff` dashboard, `/admin` extensions (`/admin/roluri`, `/admin/audit`, clients, employees, settings, returns)
6. [ ] Testing: guest limits, guest re-order block, cart transfer, customer isolation, role guards, direct URL + direct DB attempts, mobile/desktop, no store regressions
