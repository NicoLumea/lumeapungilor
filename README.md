# Lumea Packaging Hub

Build a complete, editable B2B e-commerce website for Lumea Pungilor, a Romanian company selling plastic bags, paper bags, tablecloths, and bubble wrap.

Use the attached Fear of God screenshots as the primary visual reference. The reference website is https://fearofgod.com/en-de. Adapt the design direction to a packaging supplier using our own branding, content, and product photographs.

The most important requirement: after the website is built, the owner must be able to log into a private admin dashboard and manually add products, type descriptions, change prices, and upload or replace photographs. These changes must save to a database and appear on the public website without AI prompts, code edits, or rebuilding the site.

VISUAL DIRECTION

Create a restrained, premium design based on the screenshots:

White backgrounds, black typography, and subtle light-grey image backgrounds.

Generous whitespace, square corners, thin borders, and minimal decoration.

A slim header with product-category navigation on the left, LUMEA PUNGILOR centred, and search and cart controls on the right.

Small, letter-spaced uppercase navigation and labels, with readable body text.

Three large product images per row on desktop and two on mobile, with a single-column fallback on very narrow screens.

Approximately 3:4 product-image areas. Use contain sizing for packaging photographs so the entire product is visible.

Product category, name, and price below each image.

A “Filter & Sort” control above the catalogue.

Subtle hover effects, including a second product image when available.

Editorial sections with large headings and descriptive text beside a large photograph, inspired by the third screenshot.

Avoid gradients, oversized rounded cards, heavy shadows, intrusive popups, and generic software-startup styling.

Use original branding. Do not reuse Fear of God logos, clothing photographs, or copy.

COMPANY AND CONTENT

Use Lumea Pungilor as the initial company name. Make the company name, logo, contact information, address, business identifiers, social links, and footer content editable in the admin dashboard.

Use Romanian for the initial storefront and RON for prices. Support Romanian diacritics. Keep text organised so another language can be added later.

Do not invent business addresses, certifications, customer reviews, delivery promises, or company history. Leave missing details blank and omit empty sections from the public site.

PUBLIC WEBSITE

Build:

Homepage with an editable editorial introduction and category links. Keep individual product listings on the catalogue/category pages initially.

All-products catalogue.

Category pages.

Individual product pages.

Search and filter interface.

Cart.

Checkout and order-confirmation flow.

About and Contact pages.

Editable pages for shipping information, returns, terms, and privacy.

Product pages should include a photo gallery, title, description, specifications, available options, pack information, price, stock status, quantity selector, and add-to-cart control.

Support relevant packaging specifications such as material, dimensions, colour, thickness, roll length, and units per pack. Allow optional specifications to be added, reordered, or removed.

Clearly distinguish price per selling unit from any informational price per piece. For example, if a pack contains 100 bags, buying quantity 2 means two packs, not two bags.

Provide configurable minimum order quantities and purchase increments. Validate these in both the cart and the backend.

Filters should use real catalogue data, such as category, material, size, availability, and price. Include clear empty and no-results states.

PRIVATE ADMIN DASHBOARD

Create a separate /admin area with secure login and a straightforward interface suitable for a nontechnical owner.

Product management:

Add, edit, duplicate, archive, and delete products.

Edit titles, descriptions, categories, SKU, pricing, stock, selling unit, pack quantities, minimum orders, specifications, and URL slug.

Manage optional variants with their own SKU, price, and stock.

Upload multiple photographs from a computer or phone.

Replace, delete, reorder, and select a main photograph.

Edit image alternative text.

Save as draft, preview, publish, or unpublish.

Mark products as featured and adjust display order.

Show clear save-success and error messages.

Warn before discarding unsaved changes or deleting content.

Category management:

Add and rename categories.

Edit descriptions and category photographs.

Reorder categories and control visibility.

Website-content management:

Edit homepage headings, paragraphs, buttons, and images.

Edit About, Contact, footer, and policy content.

Upload or replace the logo.

Preview content before publishing.

Order management:

View orders and their line items.

View customer and business billing details.

Track order status separately from payment status.

Add internal notes.

Export order information.

These controls must work against persistent data. Do not deliver an admin interface whose buttons only simulate saving.

DATABASE, OWNERSHIP, AND SECURITY

Do not use Shopify or another hosted commerce platform as the shop backend.

Use an exportable React/TypeScript frontend and a documented PostgreSQL/Supabase-compatible backend for authentication, database records, and image storage. Keep deployment configuration separate from application code so the project can be hosted outside Lovable.

Store products, variants, categories, images, site content, and orders in the database. Do not hardcode editable business content into components.

Implement backend-enforced permissions:

Public users can read only published products and public content.

Only authorised administrators can modify products, images, content, or orders.

Customers cannot read other customers’ orders.

Do not rely on hiding the admin page as access control.

Do not expose secret keys in browser code.

Provide a secure initial-owner setup process without public administrator registration or default passwords.

Keep cart data between visits, but recalculate price, stock, and quantity rules on the server when an order is submitted.

CHECKOUT AND PAYMENTS

Collect the necessary contact, delivery, and business invoice information, including company name and CUI where applicable.

Make shipping and tax settings configurable. Do not guess the company’s tax treatment or advertise unconfigured shipping rates.

Prepare a payment-provider integration using hosted checkout, without storing card details. Until payment credentials and business settings are configured, clearly identify checkout as a test flow and prevent real charges or misleading paid confirmations.

Confirm payment through verified server-side events. Prevent duplicate orders or stock deductions if a payment event is delivered more than once.

Preserve the purchased product name, SKU, quantity, and price within each order so later product edits do not change past orders.

INITIAL CONTENT AND HANDOVER

Start with an empty public catalogue and the initial editable categories. Do not publish invented products, stock photographs, prices, or reviews.

Use discreet empty states until the owner uploads real products. If sample records are necessary during development, keep them unpublished and clearly labelled as demo data.

Provide a short owner guide covering:

How to access the admin dashboard.

How to add the first product.

How to change its title, price, and photographs.

How to publish or hide a product.

How to edit homepage and company information.

How to manage orders.

Which external services still require configuration.

How to export the code, database, and uploaded images for migration.

VERIFICATION

Implement in stages: persistent backend and owner access; product/content editing; storefront; cart and checkout; verification.

Before declaring completion, demonstrate that:

An administrator can add a product with an uploaded photo.

Draft products are invisible publicly.

Publishing makes a product appear in the correct category.

Changing its title, price, or main photo updates the storefront after refresh.

Saved changes survive logout and a new browser session.

Unauthorised users cannot modify records or access private orders.

Cart quantities respect pack sizes and minimum orders.

Checkout rejects invalid or outdated prices and stock.

The site works on desktop and mobile with keyboard-accessible controls.

Report what is working, what was tested, and what remains dependent on credentials or configuration. Prioritise reliable product editing and purchasing behaviour alongside the reference design.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lumeapungilor.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4ad66a20-b87c-4420-81d6-9c32a2edbcf5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
