# Checkout age declaration — review and rollout

## Scope and source of truth

Base: `main` at `88393e08520c25a5300bf1683a2bd12619753bbf`. The application is TanStack Start/React, uses Zod in `src/lib/shop.functions.ts`, and uses Supabase's privileged `create_order_tx(jsonb,jsonb)` RPC for atomic order and stock processing.

Both guest and authenticated customers use `src/routes/checkout.tsx`. Both individual (`persoana`) and company (`companie`) checkout share the same server order path. The existing checkout provides **cash on delivery only**, not NETOPIA. No NETOPIA initiation/callback code was found in the reviewed repository; therefore no NETOPIA test has been run and no existing payment integration has been changed. Admin/staff order processing is separate and is not subject to the new customer submission rule.

## Change and audit

One unchecked checkbox is displayed near existing Terms acceptance. The wording changes between individuals and company representatives; changing the customer type resets the checkbox. It is deliberately omitted from session draft storage and cookie consent, so every new order requires a new explicit selection. Existing form error presentation and loading states are retained.

The server accepts an age declaration **only when its value is the boolean `true`**. Missing, false, string or arbitrary values cannot create a new customer order. An explicit, ownership-verified **idempotent replay of an already-created order** can still return its previous result, so an in-flight order is not undone by a new rule. The check occurs before product and stock work or the `create_order_tx` call. The original Terms validation remains mandatory.

The additive SQL migration adds three **nullable** fields to `public.orders`: `age_confirmed`, `age_confirmed_at`, `age_declaration_version`. The existing atomic order RPC is replaced without modifying stock logic; a confirmed new order receives `true`, server-side `now()`, and server-authored version `checkout-18-v1` in the same transaction. The server does not trust any client-supplied declaration timestamp/version. No historical rows are backfilled or reinterpreted. No new RLS rules or browser grants are introduced. The migration has **not** been executed in production.

This is a self-reported contractual declaration, not identity verification or proof that the customer is an adult.

## Staged rollout required for older/cached clients

The new server expects columns introduced by the migration; **do not deploy it before the additive migration**.

1. Obtain database backup and approval. Apply the reviewed additive migration in an isolated staging/preview Supabase database first, then after approval in production. Existing application code tolerates its new nullable fields; old order RPC callers are accepted without the optional key.
2. Stage a compatible frontend rollout before enforcing the backend rule, allowing older cached JavaScript bundles to expire. The UI sends a new optional field that the old backend ignores, so during this short period the declaration is **not yet reliably enforced or recorded**; do not claim otherwise. If a frontend-only staged release is not feasible, coordinate a maintenance/cutover moment and give clear refresh instructions.
3. Deploy backend and frontend together **only after** schema compatibility is confirmed and frontend availability is sufficiently propagated. Missing declarations now yield the exact Romanian eligibility message and **no new order**. An older cached checkout cannot submit until reloaded; it receives a structured validation failure instead of an unhandled crash. Explicitly accept this unavoidable temporary client-version limitation before enabling strict enforcement.
4. Verify using isolated/synthetic orders: guest, signed-in, company, false/missing/invalid API requests, historical order operations, concurrent duplicate submissions, stock, terms and invoice/status operations. Never run destructive tests on production.
5. Confirm preview origin, database bindings and all secrets point to a safe non-production environment before attempting a checkout. Preview protection and Cloudflare configuration remain unchanged.

No NETOPIA-specific rollout steps are needed in the current cash-only checkout. Payment callbacks for historical orders are not changed.

## Rollback

Revert the application commits (or redeploy the previous known-good application version) while **leaving the new nullable database columns and declaration records intact**. The pre-change application can continue using the updated `create_order_tx` RPC, because it handles missing `age_confirmed` by writing nulls. Do **not** drop columns, clear existing declarations, retroactively mark historical customers as confirmed, or alter paid/in-flight order processing.

If the application must be rolled back after strict enforcement, the old UI will no longer request a declaration and those newly submitted orders will have null fields; a legal/operational reviewer should approve any such temporary return to unenforced checkout.

## Verification and limits

The source repository has no tracked GitHub Actions workflow. The model's GitHub-only access does not provide a local checkout runtime or production database; no live build, browser screenshots, or full end-to-end payments can be claimed without an isolated CI/preview environment. Existing independent `node --test` scripts are listed in `package.json`; run baseline tests on unchanged `main` and the same commands on the PR before approval. The new pure tests are `src/lib/checkout-age.test.ts` and the static source/migration guard tests in `src/lib/checkout-age-contract.test.ts`. They do **not** replace live integration tests.

Manual responsive review is required at 320, 390, 768, 1024, and 1440 px. Check tab navigation, focus/error announcements, cash payment, guest purchase limit, registered and business checkout, discounts if later supported, VAT, delivery, duplicate submissions, optional cookie rejection, and checkout after a prior successful purchase. Inspect Cloudflare preview build against the exact PR SHA. If no safe preview DB is available, do not test order submission against production.

## Suggested Romanian legal amendments — NOT APPLIED

These are separate suggestions for the owner's legal advisor to review before changing the public Terms or Privacy Policy:

**Termeni și condiții (propunere):** „Prin plasarea unei comenzi, clientul declară că a împlinit vârsta de 18 ani și că are capacitatea legală de a încheia contracte. Dacă plasează comanda în numele unei persoane juridice, declară și că este autorizat să o reprezinte pentru această operațiune. Confirmarea este făcută de client prin bifarea expresă a căsuței dedicate din formularul de comandă.”

**Politica de confidențialitate (propunere):** „În legătură cu comenzile, putem păstra confirmarea declarativă a eligibilității contractuale, data și ora înregistrării acesteia și versiunea declarației prezentate la plasarea comenzii. Nu solicităm data nașterii sau documente de identitate pentru această confirmare. Durata păstrării, temeiul juridic și drepturile persoanelor vizate urmează să fie stabilite și validate de consilierul juridic înainte de publicare.”

Legal adequacy requires independent Romanian counsel review. This feature does not verify age.
