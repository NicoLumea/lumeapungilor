# Administrator access and persistence audit

## Authentication and route boundary

- The administration tree remains protected by `RequireAccess` at the `/n7q4-v2m9` parent route.
- Authentication loading finishes before access is decided. A missing session is denied, and the
  role is loaded from `user_roles`, not from URL or browser-controlled role values.
- Admin and Owner accounts use their normal Supabase session plus their trusted database role. They
  do not enter the Employee email-code flow. Employee-only accounts retain that flow.
- Child routes for products, categories, orders, returns, feedback, users, content, settings, and
  audit inherit the protected parent layout.
- Server functions and RLS continue to enforce trusted roles even if frontend navigation is
  manipulated.

## Persistence repairs

- Product fields, gallery metadata, and variants are now saved by
  `save_product_catalog_entry(...)` in one PostgreSQL transaction. A failure rolls the complete
  database edit back instead of leaving a partially updated product or deleted variant set.
- Product input is validated before the RPC and again at the database boundary. Invalid prices,
  stock, pack sizes, gallery state, or variants do not start a partial save.
- Newly uploaded product images remain pending until the product transaction succeeds. Cancelling
  the draft, removing a pending image, a failed upload batch, or leaving the editor triggers cleanup
  of those unreferenced objects.
- Existing stored images are not automatically removed with historical catalogue rows because
  `order_items.product_image_url` intentionally snapshots their paths for order history.
- Product, category, order, return, feedback, message, restock, and settings mutations request the
  affected row back. A denied or expired-session mutation that affects zero rows can no longer be
  presented as a successful save.
- Product, order, and category query failures render explicit errors instead of looking like an
  empty catalogue or empty order list.

## Authorization reviewed

- Product/category/variant CRUD uses `is_staff()`; verified Employees retain their intended
  operational access, and trusted Admin/Owner sessions are accepted without additional email MFA.
- Product-image storage upload/update uses staff policy. Admin deletion policy remains restricted
  to trusted Admin/Owner sessions.
- Orders and returns retain authenticated staff read/update policies; customer ownership policies
  remain separate.
- Restock queue policies now use the same canonical `is_staff()` session rule instead of raw role
  checks, preventing Employee MFA bypass while allowing trusted Admin/Owner sessions.
- Global content, site settings, role administration, customer administration, and audit data
  remain Admin/Owner-only.
- RLS remains enabled and no anonymous write policy or browser service key was added.

## Automated verification

- Product normalization and invalid-input rollback guards are covered by unit tests.
- The existing role hierarchy, Admin MFA bypass, Customer denial, Employee verification, redirect
  authorization, password recovery, order, return, gallery, and support tests remain in the suite.
- TypeScript, focused ESLint, and the production build are run before handoff.

## Required staging verification

The migration must be applied to a non-production Supabase environment before live CRUD testing.
With disposable Admin and Customer/Employee accounts, verify product create/edit/delete, image
upload/reorder/primary/removal, order and return updates, refresh/navigation persistence, logout,
expired-session failure, and role denial. Do not mutate production catalogue or order data for this
test.
