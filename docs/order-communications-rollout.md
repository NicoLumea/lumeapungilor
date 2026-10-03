# Manual order communications and consumer documents

## Rollout

The additive setup `20261003120000_order_communications.sql` was applied on 2026-10-03 at the owner's request to unblock preview drafts. It is replay-safe. No customer order or email was created. The separate `20261003120100_order_communications_cutover.sql` remains unapplied: apply it together with the new admin UI to revoke legacy direct status-update grants. Applying the cutover early would prevent the old admin screen saving. New private tables already have RLS and no browser grants.

There are now only two draft options, based on the selected status: confirmed (acceptance) and in delivery (dispatch), including orders already in that status. The separate invoice-email UI is removed; attach invoices through the dispatch draft. Older orders can open an editable draft before original terms are supplied, but the send declaration stays disabled until staff supplies the original terms and regenerates the draft. The server also rejects acceptance confirmation without a terms snapshot. Today's terms are never silently substituted for historical ones.

New tables are private with RLS and no browser grants. The private `order-invoices` bucket has no public or browser object policies. Authenticated staff update order state only through the guarded RPC. Existing stock and order-audit triggers remain in force. No prices, checkout totals, SEO text, public headings, or live site content are changed.

Before publishing: exercise a synthetic order in the configured preview: acceptance, draft and both text attachments, declaration and Save, invoice upload, dispatch with and without an invoice, customer invoice download and denial for another account. Check the actual staff email app can open `.eml` drafts and send with the intended sender. No actual emails have been sent in development.

## Staff workflow

Select `confirmat`, prepare the message, inspect it, download terms and withdrawal form, open the email app (or download/open the `.eml` draft), and send from `contact@lumeapungilor.ro`. Attach the documents if using mailto/webmail. Only then tick the declaration and Save. Repeat independently for `in_livrare` after acceptance; enter the DPD AWB if available. Status, tracking or chosen invoice changes invalidate the corresponding draft confirmation.

The website records the authenticated staff ID, account email, server timestamp, recipient and prepared text. This is a **manual declaration**, not proof of delivery, actual sender mailbox, or the exact message ultimately sent. Browser mailto cannot force the sending account or attach PDFs. The downloadable `.eml` includes the passive text terms/form attachments; invoice PDFs must be attached manually. Long drafts use `.eml` to avoid URL truncation. Use the clipboard option for webmail.

Acceptance includes the stored order items/variants, quantities, SKU, prices, addresses, payment method and totals. Prices already include tax. No new fiscal invoice is generated. Upload the invoice PDF issued by the company/accountant (10 MB, up to 50 pages, no active content). Original invoice bytes are preserved so signed invoices are not rewritten. Dispatch can proceed with invoice pending. The customer can download invoices after order ownership verification or request a copy by email; this does not postpone legal invoicing obligations.

New orders snapshot the existing website terms at order creation. Historical orders do not get today's terms substituted silently: staff must supply the original applicable text from the company archive if no snapshot exists. This PR does not publish the separately revised Word terms, or change refund policy. TXT attachments are intentional UTF-8 durable copies, with Romanian accents intact.

## Optional complaint photos

Customers can choose up to 3 JPG/PNG/WebP files of up to 5 MB and 24 MP. The browser decodes and normalizes them to PNG, at most 1600px per side (smaller if needed for the byte cap). The server independently checks the PNG signature, dimensions, chunk bounds, CRC and bounded decompression, decodes pixels and rebuilds the image without original metadata. Direct forged uploads are rejected; client-side validation is not the security boundary. Private existing return storage and ownership controls are preserved; authenticated submission is also rate-limited. Existing paid-order eligibility is unchanged.

The server uses pngjs with bounded standard zlib, not native sharp, because Lovable targets Cloudflare. The validator was exercised in a local Cloudflare worker: valid input 200, disguised executable 400, oversized dimensions 400. Sharp stays a dev dependency for existing image tooling/test fixtures only.

## Consumer notices

Official Romanian colour legal-guarantee SVG from the European Commission, downloaded 2026-10-03:
https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en
The original SVG is preserved, displayed on white at checkout, with a full-size accessible link and footer access. This is the legal-guarantee notice, not a claim of an additional commercial guarantee.

Official SAL pictogram from https://www.anpc.ro/sal and https://www.anpc.ro/download/sal/SAL-PICTOGRAMA.png, downloaded 2026-10-03. Linked to https://reclamatiisal.anpc.ro/. ANPC's current download is 201 x 50 px; it is shown without distortion within a 250 x 50 px link area. Source file is unchanged.

## Supplier declarations review

The four original DOCX files are preserved byte-for-byte. They are two declarations, each in Romanian and English, dated 15 September 2026. Downloads are attached only to bag-category product pages (plastic, gift, small and courier bags), following the owner's explicit confirmation that all bags are covered. Reassess if a different supplier or future delivery period is introduced. Bubble wrap and tablecloth pages do not receive this section.

Items to clarify with the issuer before publication:
- The general declaration cites Directive 94/62/EC. Regulation (EU) 2025/40 began applying on 12 August 2026, with transitional provisions; ask the supplier to confirm/update the legal references for these goods. Source: https://environment.ec.europa.eu/topics/waste-and-recycling/packaging-waste_en
- The 50-micron declaration specifically covers deliveries in 2024–2026, not an unlimited future guarantee. It lists the office as Agricultorilor/Bucuresti, which differs from the confirmed Agricultori/Buftea address. Ask the issuer to correct it; do not edit its signature/stamp or original declaration here.
- The declarations do not enumerate SKUs/batches or supply test reports. Website attachment follows the owner's coverage confirmation; it is not an independent certification of product claims. General/industrial packaging wording is not evidence of food-contact approval.
- The English 50-micron document's supplier hyperlink points through Google search. Preserved as supplied.

## Validation

- Production build and TypeScript.
- 89 Node tests, including secure image/PDF handling and unchanged email totals.
- In-memory PostgreSQL migration/RPC tests (no live data): permissions, direct-write denial, stale version, missing/wrong-actor/wrong-kind confirmations, dispatch without invoice, audit attribution, replay protection and terms snapshots.
- Reproduce SQL checks with a temporary install of `@electric-sql/pglite`, then set `PGLITE_TEST_MODULE` to its absolute `dist/index.js` and run `node scripts/test-order-communications.mjs`.
- Desktop dropdown and category navigation; mobile drawer at 390px; bag document section. Local product imagery cannot be fully verified without the hosted private-storage server credentials. Full authenticated UI/storage/email delivery verification remains a configured-preview rollout check.
