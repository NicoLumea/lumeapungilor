# Guest-return privacy and request abuse fixes

Guest returns now require the checkout access token or a signed-in account with
the order's verified email. Email matching is literal and case-insensitive, and
order identifiers alone never return customer data or issue a return session.
Old return-session tokens are rejected by the new `v2_` token format. Customers
without their checkout tab can sign in/register with the same confirmed email,
or use the contact link for assistance. Keep Supabase email confirmation enabled
(`mailer_autoconfirm=false`, verified on 2026-10-03).

The unused `guestOrderEligibility` server function was removed. Checkout no
longer explicitly discloses prior guest use in its error message. The existing
one-guest-order-per-email business rule remains: a full checkout can still be
accepted or refused under that rule. This change does not claim identical
checkout outcomes for all addresses.

General action budgets now use one server-only SQL function for atomic counters
per identifier and trusted client IP. Identifiers and IPs are HMAC hashed with
the existing login pepper/service-key fallback. Missing configuration, missing
trusted IP, RPC errors and malformed responses deny the action. The existing
Cloudflare trusted-IP convention is retained; do not expose this server behind
a proxy that permits clients to supply `CF-Connecting-IP` unchanged.

## Deployment

- Apply `supabase/migrations/20261003090000_atomic_request_limits.sql` before
  previewing/deploying the new server code. It is additive, can be replayed, and
  does not change existing tables, business data, login, roles or MFA settings.
- This helper was already applied to the connected Lovable database on
  2026-10-03. Other environments still need the migration. Reapplying it through
  the normal migration runner is safe.
- Keep `LOGIN_RATE_LIMIT_PEPPER` or the existing server-side
  `SUPABASE_SERVICE_ROLE_KEY` configured. Neither goes in browser variables.
- Merge/publish the application only through the normal reviewed workflow.
  Installing the database helper alone does not activate the application fixes.
- Rolling back the application does not require removing the additive helper.
  Such a rollback also restores the old guest-return vulnerability.

## Dependencies

The Bun lockfile updates brace-expansion to 1.1.21/5.0.12, js-yaml to 4.3.2,
nanoid to 3.3.19, and esbuild to 0.28.2. The esbuild override removes old copies
held by build-tool dependencies. The lockfile remains format 1 for compatibility.
Production build and the Drizzle CLI version smoke check pass with this override.

## Verification

- All 82 `src/lib/*.test.ts` tests passed, including 12 new proof/handler/limiter
  cases. The guest-return handler tests use synthetic orders and mocked I/O;
  they exercise the actual handler and validator, not real customer records.
- TypeScript, lint for modified application/test files, production build and
  environment/browser-secret checks passed.
- `bun audit --json` returned `{}` (no known advisories on 2026-10-03).
- The SQL tests in `scripts/test-request-rate-limit.sql` passed against the
  connected database in a transaction ending in ROLLBACK: identifier and IP
  limits, reset, input validation and denied client-role execution.
- After adding the helper, eight concurrently submitted synthetic service-role
  calls with a limit of three yielded three allowed and five denied decisions.
  Both synthetic budget rows were deleted afterward. No orders/customer rows
  were written by the verification.

To repeat SQL tests, use a trusted database session, begin a transaction, run
the migration and test SQL, then roll back. Do not commit test budget rows.

MFA changes were explicitly excluded from this fix. This is a focused repair,
not a claim that every possible vulnerability has been eliminated.
