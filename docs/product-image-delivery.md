# Product image delivery and gift-bag slug

This branch starts from `main` independently of store-details/VAT PR #39. It does not change product prices, original image objects, or public category URLs.

## Diagnosis and measured sample

The private `product-images` bucket was proxied at `/api/public/img/...` without any resizing. A catalog card and its hidden hover image each requested the original file. The first ten catalog image URLs (five cards, primary plus hover) totalled **3,847,547 bytes**. Five primary originals totalled **1,860,334 bytes**. Several 500 × 500 PNGs were 460–659 KB apiece despite cards displaying at no more than 320 CSS pixels.

With the chosen 90-quality WebP settings, locally generated variants for those five primary images totalled **179,178 bytes at 320 px** or **423,176 bytes at 640 px**. One 500 × 500 PNG changed from 640,361 bytes to 39,236 bytes at 320 px or 70,184 bytes at its original resolution for detail. A 1122 × 1402 WebP changed from 208,276 to 124,882 bytes at 640 px. Original and detail images were visually compared at full pixel resolution; no material change in crop or appearance was observed. These are local file benchmarks, not deployed network results.

## Delivery design

- Originals stay in the private bucket. Width-specific WebP objects live under `_variants/v1/w{width}/<original-path>.webp` at 160, 320, 640, 960, and 1600 px. Resizing preserves aspect ratio and never enlarges the source.
- The existing same-origin image proxy serves a requested variant after the storage backfill is complete, and falls back to the original if an individual variant is missing. A small `_variants/v1/ready.json` marker in storage activates variants automatically after a successful full backfill. Before that, the proxy caches a single readiness check per server instance and fetches originals directly, avoiding a failed variant lookup before every image. `PRODUCT_IMAGE_VARIANTS_READY=1` remains an optional server-side override. Variant URLs are immutable; an original fallback has a 30-second cache lifetime so it can be replaced soon after backfill.
- Catalog/search/featured cards use 320/640 `srcset` and `sizes`; product detail uses 960/1600; gallery thumbnails use 160. Homepage category and editorial images use the same mechanism. Existing `object-contain`/`object-cover` rules and layout sizes are unchanged.
- The first two catalog cards request images eagerly; the rest retain lazy loading. Secondary card images mount only after hover or keyboard focus. The primary remains visible until the secondary finishes loading. The old load-event opacity gate was removed because a cached image could complete before hydration and remain invisible.
- Browser uploads still save the original first, then generate WebP variants with Canvas. If local encoding fails, the original remains usable and the backfill can repair missing variants. GIF/SVG/ICO files retain their original format and behavior.
- `sharp` is a development-only dependency for the storage backfill, not part of the deployed storefront. Supabase's paid image transformation feature is not required.

## Rollout

1. Review and apply `supabase/migrations/20261002200000_normalize_gift_bag_slug.sql` through the normal migration process. It changes only the legacy `/pungi-cadou` stored slug to `pungi-cadou`; the public route was already `/categorie/pungi-cadou`, so no redirect is necessary. The admin now displays and saves normalized category slugs.
2. In the Lovable preview, open the staff/admin **Produse** page and click **Optimizează fotografiile existente**. This downloads existing originals through the same-origin proxy, creates WebP variants in the browser, and uploads only new storage objects. It shows counts, bytes and failures; it is safe to rerun. A successful full run writes the small ready marker, activating variants automatically after the server's short readiness cache expires. The original images and database records stay untouched. The browser tab must remain open until the operation finishes.
3. Alternatively, with a temporary server-side `SUPABASE_SERVICE_ROLE_KEY`, run `npm run images:backfill` for a read-only inventory, then `npm run images:backfill -- --apply` to create missing variants. A successful unlimited run writes the same ready marker. Do not put the service key in the tracked `.env`.
4. Refresh the preview after 30 seconds and inspect image response headers: `X-Image-Source: webp-variant` confirms a smaller stored variant; `original` means a fallback. Verify mobile and desktop visual quality and transferred bytes before publishing. Any later missed object safely falls back to its original. New admin uploads generate variants automatically.

The read-only inventory found **179 product-image records**, six categories, and **185 distinct eligible source paths**. No live database migration or storage write was run during this PR.

## Verification

- TypeScript, production client/SSR build, focused ESLint, image helper tests, gallery tests, SEO tests, and prelaunch SEO tests passed.
- Local browser QA at 1366 × 768 and 390 × 844 used public source images and simulated the variant bytes without writing storage. The catalog rendered 24 cards with one initial image each (rather than 45 image elements including secondary photos); hovering a multi-image card mounted the second image. Search returned matching cards, detail images loaded with responsive sources, and product/category layouts retained their dimensions and crop.
- `/categorie/folie-cu-bule` and `/categorie/pungi-cadou` returned HTTP 200; the gift-bag public path remained `/categorie/pungi-cadou`.
- Actual post-deployment page-load times and storage-proxy cache performance cannot be measured until the backfill and deployment are completed. They should be checked in Lovable preview/production after rollout.
