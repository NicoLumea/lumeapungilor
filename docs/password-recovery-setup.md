# Password recovery production setup

The application keeps Supabase Auth's clickable recovery link. The reset request uses the
origin that served the request plus `/parola-noua` as `redirectTo`. Supabase validates the
single-use link, redirects to this public route, and the browser client establishes the
temporary recovery session before `updateUser({ password })` is allowed. The route does not
change roles, profiles, orders, or password hashes directly.

## Hosted Supabase / Lovable settings

These settings are not represented in this repository and must be checked in the existing
Lovable-managed backend before release:

1. Set **Authentication → URL Configuration → Site URL** to the current production origin.
2. Add the exact production redirect `https://<current-production-domain>/parola-noua` to
   **Redirect URLs**. Add an exact Lovable preview redirect only when testing that preview.
   Do not rely on a stale Site URL fallback or use a broad wildcard unnecessarily.
3. Keep the **Reset password** email template's clickable link pointed at
   `{{ .ConfirmationURL }}`. Do not replace it with `{{ .Token }}` for this link-based flow.
4. Check whether the mail provider rewrites links or enables click tracking. Disable click
   tracking for Auth emails if it modifies Supabase's confirmation URL. If a security scanner
   is proven to consume the single-use link before the recipient clicks, use Supabase's
   documented two-step confirmation-page pattern; do not assume scanning is the cause.
5. Confirm the hosted password policy and recovery-link expiry. They are controlled by
   Supabase, not by this page. Keep the UI's minimum-password guidance aligned with the
   hosted policy.

The server still uses `PUBLIC_SITE_URL` for other canonical-site operations. Password-reset
redirects use the current request origin and require HTTPS in production, so a stale
`PUBLIC_SITE_URL` does not send recovery links to an obsolete host. No service-role key or
recovery token belongs in a `VITE_` variable or a log.

## Verification

Use disposable customer, employee, and administrator accounts. For each, request a new
reset email, click its link once, confirm `/parola-noua` shows the password form, save a
new password, and log in normally. Check that the previous password fails, the role is
unchanged, and privileged MFA runs only after the new normal login. Also check an expired
or reused link is rejected and a fresh reset succeeds. Do not mutate real accounts merely
to test this flow.
