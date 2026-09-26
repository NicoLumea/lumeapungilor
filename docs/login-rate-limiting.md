# Login rate limiting

The application login endpoints enforce two temporary server-side buckets:

- normalized email + trusted client IP: 5 failed attempts by default;
- trusted client IP globally: 25 failed attempts by default.

Both buckets use a 15-minute window and 15-minute lockout by default. The
global threshold is intentionally higher to reduce accidental blocking on
household, office, university, mobile, and other shared networks. No IP is
permanently banned.

The deployed Cloudflare Worker trusts only `CF-Connecting-IP`, which Cloudflare
sets at its edge. It does not use `X-Forwarded-For`. The email and IP are
normalized and converted to HMAC-SHA256 bucket keys before storage. Passwords,
raw emails, and raw IP addresses are never written to the rate-limit table.

## Configuration

All settings are server-only:

| Variable                       |              Default | Purpose                                                         |
| ------------------------------ | -------------------: | --------------------------------------------------------------- |
| `MAX_LOGIN_ATTEMPTS`           |                  `5` | email+IP failures before lockout                                |
| `MAX_IP_LOGIN_ATTEMPTS`        |                 `25` | failures across accounts from one IP                            |
| `LOGIN_ATTEMPT_WINDOW_MINUTES` |                 `15` | counting window                                                 |
| `LOGIN_LOCKOUT_MINUTES`        |                 `15` | temporary lockout                                               |
| `LOGIN_RATE_LIMIT_PEPPER`      | service-key fallback | dedicated HMAC secret; recommended                              |
| `SUPABASE_SECRET_KEY`          |                 none | optional new-format `sb_secret_` key for Supabase IP forwarding |

Use a random value of at least 24 characters for `LOGIN_RATE_LIMIT_PEPPER` and
never expose it through a `VITE_` variable.

## Supabase provider-level protection

The Supabase publishable key is necessarily public, so a hostile client can
call Supabase Auth directly instead of using the application login form. Keep
Supabase's native Auth rate limits enabled under **Authentication → Rate
Limits**, and consider CAPTCHA for sign-in and password reset.

When `SUPABASE_SECRET_KEY` is configured, enable **IP Address Forwarding** in
the same Supabase settings page. The application then sends the trusted edge IP
through `Sb-Forwarded-For`, as supported by Supabase for new-format secret keys.
Without that configuration, Supabase's own token bucket may see the server
egress IP, although the application's database-backed email+IP and IP buckets
still use the actual Cloudflare client IP.

Supabase's Password Verification Attempt hook can enforce policy even for
direct provider calls, but it is currently restricted to Teams and Enterprise
plans. The application-level implementation does not require that plan.

## Expiration

Expired records are deleted opportunistically during authentication checks and
updates. An expiry index keeps cleanup bounded. Successful authentication
removes the email+IP bucket; it does not clear the broader IP bucket.
