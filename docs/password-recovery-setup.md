# Password recovery production setup

The application uses Supabase Auth for recovery links and password updates. It does not create,
store, reveal, or directly change password hashes. Password changes do not write to `profiles`,
`user_roles`, orders, or account-approval records, so customer, employee, administrator, and owner
roles remain unchanged.

## Application environment

Set `PUBLIC_SITE_URL` on every deployed server to the canonical public origin, without a path. Use
the custom production domain after it is connected, for example `https://www.example.ro`. The
server builds recovery redirects as `${PUBLIC_SITE_URL}/parola-noua`. In local development only,
the request origin is used when this variable is absent. Production rejects an HTTP URL.

The existing server-only variables remain required: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, and `LOGIN_RATE_LIMIT_PEPPER` (or the documented service-role fallback).
Never expose service-role, secret, recovery, access, or refresh tokens in `VITE_` variables.

## Supabase dashboard checks

These hosted-project settings cannot be verified or changed from this repository. Before release,
open **Authentication** in the Supabase dashboard and complete all of the following:

1. Under **URL Configuration**, set **Site URL** to the canonical production origin.
2. Add the exact production redirect `https://<custom-domain>/parola-noua`.
3. While still deployed on Lovable, add its exact deployed origin followed by `/parola-noua`.
4. For local testing, add `http://localhost:8080/parola-noua` (or the actual local Vite port).
5. Add exact preview redirect URLs only when they are genuinely needed. Prefer exact URLs over a
   broad wildcard.
6. Under **Email Templates → Reset password**, keep the secure `{{ .ConfirmationURL }}` link.
   Never put a password or token text into the message body.
7. Under **SMTP Settings**, configure a custom production SMTP provider and its verified sender
   domain. No SMTP credentials are present in the repository, so the current production delivery
   status is unverified. Supabase's default sender is intended only for limited testing.
8. Under **Email Templates → Security notifications**, enable **Password changed** and customize
   its template if desired. Its enabled status is not represented in Git and remains unverified.
9. Confirm the hosted password minimum remains at least 8 characters. If the dashboard policy is
   strengthened, update `MIN_PASSWORD_LENGTH` and the UI guidance in the same release.

After switching domains, update `PUBLIC_SITE_URL`, the Supabase Site URL, and the redirect allow
list together before sending recovery emails. Old deployed origins may remain temporarily allowed
during a controlled transition, then should be removed.

## Verification with designated test accounts

Use dedicated customer, employee, and administrator test accounts. For each account, request a
reset, follow the email once, set a new password, verify the old password fails and the new password
works, then verify the role and associated profile/order data are unchanged. Also verify an expired,
invalid, or reused link is rejected. Do not perform these password-mutating tests against real user
accounts.
