# Security role and staff email-verification audit

## Scope and assurance boundary

This audit covers the React/TanStack application, privileged server functions, and the checked-in
Supabase policies. Staff email verification is an **application-level second login check**. It does
not alter the Supabase JWT `aal` claim and must not be described as native AAL2. Supabase TOTP or
phone MFA would be required for native AAL2.

## Permission matrix

| Capability                                            | Guest | Customer                                                | Employee | Admin | Owner              |
| ----------------------------------------------------- | ----- | ------------------------------------------------------- | -------- | ----- | ------------------ |
| Browse public catalogue/content                       | Yes   | Yes                                                     | Yes      | Yes   | Yes                |
| Guest checkout/order verification                     | Yes   | Yes                                                     | Yes      | Yes   | Yes                |
| Own profile/orders/returns/support                    | No    | Yes                                                     | Yes      | Yes   | Yes                |
| Staff dashboard before email check                    | No    | No                                                      | No       | No    | No                 |
| Orders, operational statuses, returns, support inbox  | No    | No                                                      | Yes      | Yes   | Yes                |
| Products, categories, stock and product images        | No    | No                                                      | Yes      | Yes   | Yes                |
| Global content, legal pages and private site settings | No    | No                                                      | No       | Yes   | Yes                |
| Customer/team account administration                  | No    | No                                                      | No       | Yes   | Yes                |
| Grant/revoke employee access                          | No    | No                                                      | No       | Yes   | Yes                |
| Approve administrator promotion                       | No    | No                                                      | No       | No    | Yes                |
| Initial owner bootstrap                               | No    | Confirmed account only, and only before an owner exists | Same     | Same  | Closed after claim |

Every Employee/Admin/Owner capability in the table additionally requires a non-expired
`staff_verified_sessions` row bound to both the authenticated user and the JWT `session_id`.

## Routes audited

- Customer: `/cont`, `/comenzile-mele`, `/retururi`.
- Employee: `/staff`, `/staff/produse`, `/staff/categorii`, `/staff/comenzi`,
  `/staff/retururi`, `/staff/stoc`, `/staff/mesaje`.
- Administrator: `/n7q4-v2m9` and its products, categories, orders, users, customers, roles,
  returns, restock, messages, content, settings, audit and guide children. The legacy `/admin`
  address intentionally renders a public 404 and exposes no authentication or bootstrap UI.
- Authentication: `/autentificare`, `/api/auth/login`, password-reset routes.

The `/staff` and internal administration layouts previously relied on client role state for route presentation.
Their children use direct Supabase queries, so RLS was the final data boundary. The layouts now also
block rendering until application verification succeeds. Employee content navigation and the former
`/staff/continut` route are removed; global content is available only inside the Admin/Owner portal.

## Server functions audited

- `account.functions.ts`: employee requests, employee suspension, administrator promotion and
  owner decision, guest eligibility, contact submission.
- `admin-users.functions.ts`: account dashboard, commercial-interest dashboard, password-reset
  dispatch and CSV export.
- `shop.functions.ts`: checkout and owner bootstrap.
- `returns.functions.ts`: authenticated own-order returns and rate-limited guest return sessions.
- `restock.functions.ts`: public subscription/unsubscription.
- `recommendations.functions.ts`: public aggregate product identifiers only.

Privileged service-role functions now call the reusable `hasVerifiedPrivilegedAccess` check. It
verifies the role from trusted database state and checks the current JWT session against the
server-only verification table. Browser-provided role values are never accepted.

## RLS policies audited

- `user_roles`: self-read remains; team-wide read is Admin/Owner only; client writes remain revoked.
- `profiles`: self access remains; the latest checked-in policy limits cross-account reads to Admin.
- `orders` and `order_items`: own-customer reads remain; operational staff access uses verified
  `is_staff()`.
- `return_requests`, return items, image metadata and evidence storage: ownership policies remain;
  staff policies now require verified staff state.
- `contact_requests`: customer own-read remains; staff inbox read/update requires verified staff.
- products, categories, variants, images and product-image storage: public published reads remain;
  employee modification remains intentionally supported but requires verified staff.
- `site_content`, `content_sections`, and `site_settings`: Employee write/read policies for private
  CMS/configuration data are removed; Admin/Owner verification is required.
- `audit_logs`, employee requests, role-change requests and admin dashboard RPCs: Admin/Owner checks
  inherit verified-session enforcement.
- authentication throttles, staff challenges, verified sessions and guest-return sessions remain
  service-role only with RLS enabled and no client policies.

## Vulnerabilities found and fixed

1. Employees had a visible content route and a `staff manage content` RLS policy. Both boundaries are
   now Admin/Owner only.
2. Staff role checks did not distinguish password authentication from a privileged verified login.
   The RLS helpers now require a short-lived server-side session verification.
3. Privileged service-role functions checked roles but not a second login step. They now use the
   shared server authorization helper.
4. The admin user functions could infer authorization by selecting the caller's own role, which did
   not prove staff verification. They now verify role plus session server-side.
5. The owner bootstrap accepted the setup secret even after initialization. It now checks that no
   owner exists before checking the secret, requires confirmed email, is rate-limited, is audited,
   and is protected against concurrent double claims by a single-owner index.
6. The administrator-promotion decision accepted the owner setup secret as an ongoing bypass. Only
   a verified Owner may now decide it.
7. Signup wording treated confirmation as optional. The UI and login endpoint now require a
   confirmed address; Supabase Auth must also have Confirm Email enabled.
8. Content/settings changes did not have a dedicated audit trigger. Key-only audit entries are now
   recorded without copying potentially sensitive values.

## Staff email-code design

- Password verification happens first through the existing rate-limited login endpoint.
- The role is read with the service-role client, never from browser input.
- Supabase Auth sends and hashes the six-digit email OTP; the application never stores plaintext.
- Application challenge metadata contains user ID, original password-session ID, expiry, resend
  cooldown, attempt count and one-time/invalidated timestamps.
- OTP verification is performed server-side. The verified privilege is written only for the
  original password session and expires after 12 hours by default.
- Attempts are consumed atomically under the database update and stop at five. Codes expire after
  ten minutes in application state; resend defaults to 60 seconds and five sends per hour.
- Replacement, successful use and role changes invalidate prior challenges or privileged sessions.
- Sign-out paths attempt immediate verification-row cleanup; token revocation remains the ultimate
  session boundary if cleanup cannot run.
- No OTP, password, refresh token or service secret is logged or included in an audit record.

## Tests run

- Role hierarchy and employee/Admin separation unit tests.
- Session-binding parsing and masked-email tests.
- Existing authentication, password recovery, product gallery, return and support tests.
- TypeScript, focused ESLint, migration static review and production build.

## Remaining manual/live tests

These require the target Supabase project, SMTP delivery and disposable Guest/Customer/Employee/
Admin/Owner accounts:

- apply the migration in a staging/preview database and run the full 44-case role matrix;
- verify direct REST/RPC calls with anon, customer, unverified employee, verified employee,
  unverified admin and verified admin tokens;
- confirm the email template produces a six-digit OTP and that expiry/cooldown behavior matches;
- verify account confirmation, checkout, password reset, returns and support with real email;
- confirm password change/session revocation behavior in the project's configured Supabase session
  policy; and
- confirm existing production data contains no more than one Owner before applying the single-owner
  index.

## Deployment requirements

1. Apply `20260928120000_role_security_staff_mfa.sql` through the normal reviewed Supabase migration
   process. GitHub/Lovable sync does not apply database migrations.
2. In Supabase Auth, enable **Confirm Email**.
3. Configure the email OTP template to include `{{ .Token }}` and set OTP expiry to 600 seconds.
4. Configure production Custom SMTP and test delivery. Until this is done:
   **PRODUCTION SMTP CONFIGURATION REQUIRED**.
5. Retain existing server secrets: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` (or the project's compatible secret key configuration).
6. Optional tuning variables: `STAFF_MFA_RESEND_SECONDS` (default 60) and
   `STAFF_MFA_SESSION_HOURS` (default 12). `OWNER_SETUP_CODE` and `OWNER_SETUP_EMAIL` are needed only
   before the one-time owner claim and should be removed/rotated after the Owner exists.
7. After merge, let the existing Lovable Git integration sync `main`, verify environment variables,
   preview the project, complete the live matrix, then publish. Do not create a new Lovable project.
