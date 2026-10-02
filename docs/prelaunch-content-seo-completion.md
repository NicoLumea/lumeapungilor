# Pre-launch content and SEO completion audit

Date: 2026-10-02

Branch: `feature/prelaunch-content-seo-completion`

Base: latest `origin/main` at branch creation (`75ba6b0`)

## Scope and preserved architecture

This change extends the existing Supabase content, category, and product records. It does not add a second CMS or catalogue. The public browser data path remains the one documented in `docs/product-seo-fetch-path-audit.md`: `Catalogue` and product pages use the existing hooks in `src/lib/products.ts`, the `products` and `categories` tables, and ID-based `product_categories` relationships. Price, inventory, product IDs, category IDs, checkout, orders, authentication, MFA, returns, image ordering, and support data are unchanged.

The server SEO adapter is anonymous, read-only, and RLS-protected. It supplies initial crawlable HTML only; the hydrated application continues to use the existing live data layer.

The only remote branch not merged into `main` was `origin/feature/role-security-and-staff-mfa`. Its tree has no changes relative to `origin/main`, so it contains no overlapping implementation and introduces no likely file-level conflict.

## Database rollout

Apply `supabase/migrations/20261002180000_prelaunch_content_seo.sql` before deploying the application code. The migration is additive:

- adds category introduction, body, and metadata columns;
- adds product metadata columns;
- creates the admin-protected, publicly readable `seo_redirects` table;
- captures old published product/category paths when slugs change;
- blocks unsafe paths, duplicate sources, and redirect loops;
- copies existing home content into the alternate field name only when that alternate is empty;
- creates the `site_content.seo` settings block without replacing existing content.

The migration does not delete or rename populated columns and does not mutate products, prices, inventory, memberships, customers, or orders.

## Verification evidence

- TypeScript: passed (`tsc --noEmit`).
- Hand-authored changed-file ESLint: zero errors; four Fast Refresh advisory warnings for files that intentionally export both components and pure helpers. The generated Supabase types retain their generated formatting. The required repository-wide lint was also run and remains red on the pre-existing Windows CRLF/Prettier baseline (11,727 findings across the repository); the PR deliberately does not reformat unrelated files.
- Production build: passed for client, SSR, and Nitro/Cloudflare output. Existing `inputValidator()` deprecation and large-chunk warnings remain.
- Automated tests: 65 passed, 0 failed.
- Environment exposure check: passed.
- Live category regression: 63 published products, six visible categories, all six memberships identical, zero changed categories, zero missing products, zero duplicates.
- Full local SSR crawl against public Supabase data: 63 product URLs and six category URLs checked; 63 Product JSON-LD pages; 59 category-to-product links; zero empty shells, broken product links, or duplicate canonical URLs.
- Route smoke test: `/magazin`, `/produse`, `/despre`, `/contact`, `/livrare`, `/retur`, `/termeni`, and `/confidentialitate` returned 200 with exactly one H1 and one canonical. A representative category and product returned 200 with one H1, one canonical, and the expected JSON-LD. An unknown route returned HTTP 404.
- Mobile browser check at 390 × 844: homepage, category, and product layout rendered without horizontal overflow; category and product navigation remained usable. The local image proxy returned HTTP 503 for product images and the Lovable asset path returned HTTP 404, so image appearance still needs verification on the deployment.

## Existing systems audited and retained

- Sitemap: retained; still reads published products and visible categories, includes static routes, uses `updated_at`, and shares the configurable public origin.
- Robots: retained; still references the configured sitemap and does not block product/category routes.
- Canonicals: retained and completed where missing; all use `VITE_PUBLIC_SITE_URL` through the existing origin helper.
- Structured data: existing Organization, Product, and product BreadcrumbList schema retained. Product availability still reflects actual stock and no brand or SKU is invented.
- `/produse`: retained as a complete server-rendered link index; it is not replaced with client-only pagination.
- Category navigation: the header and footer now normalize the stored leading slash on the legacy `pungi-cadou` slug before building links. Two mismatched About-page category links were corrected to the existing category slugs; category IDs and memberships were not changed.
- Image alt text: existing editing/rendering retained; the admin now warns when a published product image lacks alt text.
- 404 UI: retained; the route test confirms a real HTTP 404.

## Manual input before launch

- Enter and validate the real trading address in Admin → Content; none was invented.
- Enter the Google Search Console token in Admin → Content → SEO technical, then verify ownership in Search Console.
- Review and complete any pre-existing legal placeholders in Terms/Privacy with Romanian legal counsel.
- Set `VITE_PUBLIC_SITE_URL=https://lumeapungilor.ro` in the production environment before the domain cutover.
- Optionally upload a dedicated default social-sharing image; the existing site hero asset is the safe fallback.
- Review all editable metadata and category body copy before publishing; no marketing claims were fabricated.

The verified primary and secondary phone values already stored in `site_content.company` are now preferred everywhere. The hardcoded fallback was reconciled to the verified primary value; the suspicious incomplete value was not guessed.
