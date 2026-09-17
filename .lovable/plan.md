# Entry page + role-based accounts for Lumea Pungilor

The existing store stays exactly as it is: products, categories, prices, stock, images, cart, styling. We add a public entry page in front of it and a real, server-enforced account system with four levels.

## Pages

- `/` — new public company entry page (no login needed)
- `/magazin` — the current store homepage, moved here unchanged
- Everything else (`/produse`, `/categorie/...`, `/produs/...`, `/cos`, `/checkout`, `/comanda/...`, legal pages) keeps its address; header/footer links are repointed to `/magazin`.

### The entry page contains
Company introduction, short explanation of Lumea Pungilor, main categories, six real available featured products (same cards and animations as now), benefits of having an account, a login/register panel, "Continuă ca vizitator", "Intră în magazin" for signed-in users, contact details, and the existing legal links. Same visual language: white and warm beige, black type, restrained burgundy, quiet motion.

### New pages
- `/cont` (profile), `/comenzile-mele`, `/retururi` — customer area
- `/ajutor-comanda` — public "order without an account" help: look up an order with order number + verified email, plus the legally required return/withdrawal/complaint contact routes (wording kept editable in the content manager, no invented legal text)
- `/staff` — employee dashboard
- `/admin` — administrator dashboard, extended with `Clienți`, `Angajați`, `Cereri de acces`, `Retururi`, `Setări`, `/admin/roluri`, `/admin/audit`

## Account levels

- **Vizitator** — browse, search, filter, add to cart, one checkout per verified email address. Cart limited to a configurable number of distinct products (setting `guest_cart_max_distinct_products`, default 3, editable by admins), with the limit explained before checkout.
- **Client** — unlimited repeat orders, full cart, own order history, own returns and complaints, profile and password management, account-deletion request.
- **Angajat** — never created by public sign-up. An admin invites, or the person requests access and an admin approves; the approval is recorded. Employees manage products, images, stock, categories, orders, returns, messages and approved content, with preview before publishing. They cannot grant roles, approve accounts, touch settings, secrets or audit records.
- **Administrator** — everything employees can do, plus customers, employees, access requests, settings, reports and read-only audit log.

Promoting somebody to administrator always stays `pending_owner_approval` and can only be approved by the project owner, identified by a server-side secret that never reaches the browser. Requester, candidate, approver, time and decision are recorded. Nobody can approve their own promotion.

Website roles are separate from Lovable project access. Nothing on the website can grant editor, source-code or secret access — the project owner still invites people manually inside Lovable.

## Security

Every permission is enforced in the database and in server functions, not by hiding buttons. Role enum extended to `customer`, `employee`, `admin`, `owner`; roles live in the protected `user_roles` table, nobody can change their own. Row-level policies rewritten so customers only ever see their own orders, returns and messages; employees get exactly the operational tables; audit rows are insert-only and never deletable. Checkout re-validates prices, stock, cart limits and the one-guest-order rule on the server. Important commerce records are archived, never hard-deleted. Login, registration, password reset, guest order lookup and checkout get rate limiting.

New tables: `profiles`, `employee_requests`, `role_change_requests`, `guest_checkout_usage`, `return_requests`, `contact_requests`, `site_settings`, `content_sections`, `audit_logs`. Existing tables are extended, not replaced.

When access is denied, the page shows a calm Romanian message with a link to sign in or return to the shop, and remembers where the person wanted to go.

## Checkout

Guests see the distinct-product limit up front, confirm their email, and the server checks whether that email already completed a guest order — if so it explains an account is needed and offers sign-in or registration. The cart survives registration and carries into the new account. Customers order repeatedly, with orders tied to their account and kept in history.

## Assumptions

- Email confirmation stays on, so registration asks people to confirm by email before ordering as a customer.
- Two-factor authentication is not available on the current backend; owner approval instead requires a recent sign-in plus the owner secret. I will flag this rather than fake it.
- Employee/admin dashboards reuse the existing admin screens where they already exist, with permissions narrowed per role.

## Delivery order

1. Database: roles, new tables, policies, settings, audit triggers.
2. Server functions: registration/roles, guest-order rule, approvals, audit writes, hardened checkout.
3. Entry page at `/`, store moved to `/magazin`, links updated.
4. Login panel, customer area, guest order help page.
5. Employee and administrator dashboards with access requests and audit view.
6. End-to-end testing of every flow listed in the brief, on mobile and desktop.

This is a large build; I will work through the steps in order and report progress as each layer lands.
