# Administrator authorization and persistence

## Login and MFA

Password login creates a Supabase session. Users with a trusted `employee`,
`admin`, or `owner` row in `public.user_roles` complete the email challenge once
for that login. Verification is recorded server-side in
`public.staff_verified_sessions` against the new Supabase `session_id` and user
ID. The browser then adopts the verified Supabase access/refresh tokens.
Navigation and normal CRUD actions never start another challenge. A new login
session must verify again. This is an application email challenge, not Supabase
AAL2.

The `user_roles` table is the role source of truth. The admin dashboard uses
the server's role lookup; RLS functions `is_admin()`/`is_staff()`/`is_owner()`
independently check the trusted table and verified active session. Route hiding
is not a security boundary. Owners count as administrators.

## Database and Storage

Apply all migrations through `20261001190000_admin_write_authorization.sql`
to the connected Supabase project **in order**. Git/Lovable sync alone does not
apply SQL migrations. The latest migration removes historical staff-wide
catalog/content write policies: PostgreSQL OR-combines policies, so adding an
admin policy without dropping the staff policy did not restrict employee writes.
It recreates admin-only CRUD RLS for products, variants, image metadata,
categories and site content, plus admin-only product-image Storage
SELECT/INSERT/UPDATE/DELETE. The private bucket remains readable to the
storefront through `/api/public/img/*` on the application server. Other dashboard
tables retain their appropriate admin or operational-staff policies: orders,
returns, feedback, contact requests, restock requests, settings and audit data.

The browser uses only the publishable Supabase key. Product saves call the
`save_product_catalog_entry` RPC, which writes the product, gallery metadata and
variants in one RLS-enforced transaction; the client reads the saved record back
before reporting success. Image bytes upload to the private `product-images`
bucket; image ordering/primary choice updates metadata via a restricted RPC.
Content and other forms await Supabase responses and refresh query data.

## Configuration

The tracked root `.env` contains **public publishable values only**, including
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and
`VITE_SUPABASE_PROJECT_ID`. Keep it tracked for published builds. The server
needs `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` as deployment secrets for MFA and private image
serving. Never put the service-role key in `.env` or a `VITE_` variable. Login
rate limiting also requires `LOGIN_RATE_LIMIT_PEPPER` (or its documented
server-side fallback). Email OTP delivery must be configured in Supabase.

## Staging verification

Use a disposable staging admin and test product. After applying migrations and
deploying this branch: log in, complete MFA once, create a draft with an image,
reopen it, change title/description/price/stock/specifications/gallery order and
primary image, save, refresh, then publish and verify the storefront. Archive or
delete the test product and verify metadata is gone. Repeat a read after browser
refresh and after logout/login. Test that customer and anonymous sessions cannot
write via Supabase, including Storage. Record any failed response code in a
development console; production toasts use non-sensitive error categories.
