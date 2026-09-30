# Environment configuration boundary

The browser receives only the `VITE_SUPABASE_*` publishable values. Vite embeds
every `VITE_` value into client code, so never use that prefix for a password,
service-role key, cron secret, setup code, or rate-limit pepper. Supabase RLS
and server authorization remain necessary even with a publishable key.

Private values (`SUPABASE_SERVICE_ROLE_KEY`, optional `SUPABASE_SECRET_KEY`,
`LOVABLE_CRON_SECRET`, `LOGIN_RATE_LIMIT_PEPPER`, and `OWNER_SETUP_CODE`) belong
in the hosting environment's server-side secret settings. Server functions
read them through `process.env`; admin screens must never return their values.
Use `.env.example` only as a list of names and placeholders. The root `.env` is
managed by Lovable Cloud, contains only public (publishable) connection values,
and must stay tracked: the published site is built from Git and bakes those
values into the browser bundle. Never put private keys in it. `.env.local` and
other `.env.*` files stay untracked.

The previously tracked `.env` contained Supabase project configuration and
publishable keys, not a service-role or other private credential. Removing the
file from the current tree does not erase Git history. If any private value was
ever copied into a public `VITE_` variable, Git commit, build output, browser
log, or support ticket outside this audit, rotate it with its provider.

After merging, configure the same required values in Lovable's connected
server environment before deployment. Developers with older clones should
copy their local `.env` to a safe untracked location before updating `main`,
then recreate it from `.env.example` and their own secret manager. Do not put
real values in pull requests, issue comments, or screenshots.

The app rejects direct requests for environment and key files at its server
entry point. Vite's development server also denies `.env` files by default.
Deployment must never copy local environment files into the public/static
directory; run `pnpm build` followed by `pnpm test:env-security` to inspect the
browser output. For a stronger value-level check, set a throwaway
`ENV_SECURITY_CANARY` value equal to a private environment value during a test
build and run the same check. Never use a real credential as the canary.

Existing Supabase customer sign-in intentionally returns a user session to the
browser, where the client SDK persists it. That user session is
not a server environment secret. Eliminating all JavaScript access to user
sessions would require a separate, coordinated move to HttpOnly cookie auth;
it is not part of this configuration-only change.
