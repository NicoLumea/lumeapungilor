# Cloudflare previews and manual publication

## Status

Repository preparation only. No Cloudflare application has been created, no domain or DNS has been changed, and no database has been moved. Lovable remains the current host. A Cloudflare login and access to the backend credentials are required to finish setup. Do not disconnect/delete the Lovable project while it still owns the database or uploaded files.

Verified locally on October 3, 2026: preview and production bundles build with explicit test settings; the existing ordinary build still passes; TypeScript and targeted ESLint pass; eight deployment/sensitive-path tests pass; the browser exposure check passes. Wrangler's upload dry run reports about 4,937 KiB uncompressed / 1,123 KiB gzip. In the local Cloudflare runtime, robots returns 200 with noindex, the sensitive `.env` path returns 404, and the favicon and exact 2,142,803-byte hero image return 200. These checks used fake backend credentials and do not establish working hosted orders or authentication.

Lovable package-mirror URLs were removed from the lockfile without changing their package versions/integrities. A fresh frozen installation from public npm succeeded (551 packages). The existing Lovable build libraries remain installed; they are public npm packages and do not require a Lovable subscription for this build.

## Daily workflow after setup

1. Push a feature branch. Cloudflare Builds runs `npm run build:cloudflare`, then `npm run cf:preview`. Open the link under the Worker's **Previews** section or the GitHub pull request.
2. Review the site with test data. Each branch has a separate application preview, but these previews share the configured test Supabase project. They do not automatically get separate databases.
3. Merge the approved pull request into `main`. Cloudflare builds again against the production backend settings and runs `npm run cf:upload`. This uploads a version without publishing it.
4. In **Workers & Pages → lumeapungilor → Deployments → Promote deployment**, choose the version corresponding to the approved main commit and send 100% of traffic to it. The spelling of the Worker name is `lumeapungilor`.
5. Use **Rollback** in that deployment history if the code needs reverting. Database changes, orders, stock, uploads and secrets are not undone by a code rollback.

The final main version is rebuilt for production credentials; the test-backend artifact is never promoted directly. Version URLs for the production build use production resources: do not test orders or admin writes there. Use the branch Preview instead.

## One-time account setup

1. Establish backend ownership first. The owner currently accesses the database through Lovable and has not confirmed a separate Supabase account. Locate the existing project's connection settings and securely obtain the server key, or migrate the backend into an owner-controlled Supabase project. Do not paste private keys into chat, Git, or a `VITE_` variable.
2. Prepare a separate test Supabase project with the required schema, security policies, catalog and image files. Use synthetic customer/order data and test users. Applying historical migrations blindly is unsafe: reconcile migrations with the actual schema and backups first. Preview builds deliberately refuse the production database and the existing database recorded in the tracked `.env`.
3. In Cloudflare **Workers & Pages**, create a Worker named `lumeapungilor` on its default `workers.dev` hostname. A starter Worker is sufficient for this first creation; attach no custom domain yet. The first Worker creation must use a deployment, because versions cannot be uploaded before a Worker exists.
4. Add the runtime secrets below, separately for **Production** and **Previews Base**. In each test environment use only test credentials. Base secret updates apply to newly created Previews; update/recreate existing Previews when rotating them.
5. Connect `NicoLumea/lumeapungilor` under the Worker's **Settings → Builds**. Set production branch to `main`, repository root to `/`, and configure the following commands before starting a repository build:

| Setting                   | Value                      |
| ------------------------- | -------------------------- |
| Build command             | `npm run build:cloudflare` |
| Production deploy command | `npm run cf:upload`        |
| Preview command           | `npm run cf:preview`       |
| Preview builds            | Enabled                    |
| Node version              | `24.15.0`                  |
| Bun version               | `1.4.2`                    |

The repository has a Bun lockfile. Use `bun install --frozen-lockfile` if setting the dependency install command explicitly. Wrangler is pinned in devDependencies. Never replace the production command with `wrangler deploy`: that would publish on each push. Do not leave the default deploy command in place.

Cloudflare Build settings need these **public build variables**, supplied explicitly for both environments:

| Production                            | Preview                            |
| ------------------------------------- | ---------------------------------- |
| `PRODUCTION_SUPABASE_URL`             | `PREVIEW_SUPABASE_URL`             |
| `PRODUCTION_SUPABASE_PUBLISHABLE_KEY` | `PREVIEW_SUPABASE_PUBLISHABLE_KEY` |
| `PRODUCTION_SUPABASE_PROJECT_ID`      | `PREVIEW_SUPABASE_PROJECT_ID`      |
| `PRODUCTION_SITE_URL`                 | `PREVIEW_SITE_URL`                 |

Use `https://lumeapungilor.ro` for production site origin at cutover. For the preview site origin, use an HTTPS test hostname that you control/configure. Password recovery uses the request origin; add the exact test origin/callback to the test Supabase Auth allowlist. The preview is marked `noindex` in HTTP headers and robots, independently of the existing SEO fields. Protect preview access with Cloudflare Access if needed; noindex is not access control.

The build script reads `WORKERS_CI_BRANCH`: main is production, every other branch is preview. Outside Cloudflare Builds pass `--target=preview` or `--target=production`. It replaces only the build's public connection values, leaving the tracked `.env` intact for Lovable. The generated deployment configuration is `.output/server/wrangler.json`; every repository release command explicitly uses it.

**Runtime secrets** in Cloudflare (never required during build):

- `SUPABASE_SERVICE_ROLE_KEY`: that environment's Supabase server key, used by the current trusted server code. Private product images also require this connection.
- `LOGIN_RATE_LIMIT_PEPPER`: a stable random secret (at least 32 characters), distinct between test and production.
- `SUPABASE_SECRET_KEY`: only if required by the existing Supabase Auth configuration; preserve the backend's existing setup.

The generated configuration supplies the matching public runtime URL/key, site origin and environment marker. The outer handler refuses application requests when the runtime backend differs from the browser build or the server key is absent. Do not add owner-bootstrap credentials to the new host for an already established owner. No cron triggers are configured by this PR; audit any actual Lovable jobs before decommissioning it.

## What GitHub contains and what still needs transfer

- Application code, legal documents and the two actively referenced Lovable-hosted static images are in Git. The images are exact originals under their existing paths, including the social image fallback; no image redesign or metadata wording changes were made.
- Products, categories, descriptions, prices, site content, users, orders and permissions are in Supabase. Pushing the repository does not copy them.
- Product originals and optimized variants are in the private `product-images` storage bucket. Complaint images and invoice PDFs are private storage too. Copy all objects plus policies and preserve object paths and variant readiness markers if changing projects.
- Auth users, sessions, password recovery, MFA and service credentials need a verified migration plan. Customers may need to sign in again; do not promise portable active sessions.
- Existing SQL migration files are not a database backup. A complete export, row/object counts and a restore test are required before retiring the source backend.

## Verification before domain cutover

Repository checks:

```sh
npm run test:cloudflare
npx tsc --noEmit
npm run build:cloudflare -- --target=preview
npm run cf:check
npm run test:env-security
```

The build requires the explicit public settings above; missing credentials should fail. `cf:check` is an upload-size/configuration dry run only. It does not prove hosted CPU limits, database connectivity, sign-in or checkout. Validate those on the actual Cloudflare Preview after account setup:

- Desktop/mobile homepage, catalog/category/search/product pages and full-resolution image URLs.
- Admin login/MFA, test product editing/upload, customer login/password recovery.
- Test checkout and stock changes against the test database; verify order email drafts and invoice/complaint access.
- Normal and optimized product images, all legal document downloads, old URL redirects, sitemap origin, and canonical URLs.
- Preview `X-Robots-Tag: noindex, nofollow`, `/robots.txt` blocking indexing, and absence of private credentials in downloaded browser files.
- Cloudflare request/CPU/startup metrics under representative load. A free plan is not a guarantee this dynamic store fits all limits; particularly test image normalization and PDF handling. No paid upgrade is authorized or performed by this work.

Once verified, add the custom domain in the Worker's domain settings. Keep registration at RoTLD. Review existing DNS, preserve mail MX/SPF/DKIM/DMARC records, configure the intended apex/www behavior and confirm TLS. Update Supabase Auth site URL/allowed callbacks and check the published site. Keep Lovable available until independent hosting **and** backend operation are proven.

## References

- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Build settings and branch variables](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Preview configuration and secrets](https://developers.cloudflare.com/workers/previews/configuration/)
- [Manual version deployment](https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/)
- [Current Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Lovable hosting and ownership](https://docs.lovable.dev/tips-tricks/deployment-hosting-ownership)
