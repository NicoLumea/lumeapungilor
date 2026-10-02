# Store details and included-tax notices

## Merge coordination

Branch: `fix/store-details-vat-eco-tax`, based on the fetched `main` on 2 October 2026.
No deployment, live database write, order submission, or email sending was performed.

Apply `20261002200000_store_details_vat_eco_tax.sql` before releasing the UI. The product
editor saves the new nullable `eco_tax_applicable` column. The migration also corrects
the hosted company content; until it is applied, existing CMS phone numbers/hours still
override the corrected application fallbacks. Coordinate this migration and the
ProductsPanel edits with Lovable. It patches company keys and known terms placeholders,
preserving unrelated CMS fields and legal text rather than replacing whole documents.

## Audit and behavior

- Searched tracked source, migrations, metadata, and the anonymous public catalog/CMS
  for case-insensitive Zebe references. None were found. No technical identifiers or
  external integrations were renamed.
- Corrected the old fallback phone and About hours. The CMS migration replaces
  `DECORAMA IMPORT SRL`, `RO42644740`, `J40/6525/2020`, the Aleea Ilia legacy address,
  both old phone numbers, and old contact hours with the supplied details.
- Registered office and returns address remain separately labelled. Returns address
  is editable and appears through CompanyIdentity on contact, footer, legal and seller
  surfaces. Organization metadata includes the website and support email.
- Checkout/order assistance already imports the shared support phone/email. Privacy
  and order PDFs already use the correct legal operator. No customer email templates
  or delivery provider implementation are stored in this repository; hosted Supabase
  authentication email templates/sender settings require a separate service audit.
- ProductCard covers catalog, category/search results, recommendations and previously
  purchased products. Product detail uses the same PriceNotice component. Exactly one
  label is rendered: `TVA inclus`, or `TVA și ecotaxă incluse` only for explicit `true`.
- No product/variant price, VAT rate, shipping setting, tax formula, or checkout total
  calculation was changed. Public settings at audit time: VAT rate null, delivery 30 RON.

## Eco-tax confirmation needed

The 63 public products have no existing eco-tax attribute and empty specification arrays.
Names/descriptions and broad categories do not provide a confirmed tax classification.
All existing products therefore remain NULL (unconfirmed); no bag is automatically
assigned the eco-tax label. Bubble wrap and tablecloth rolls show only `TVA inclus`.

Confirm applicability per SKU (including all variants) in these exact catalog categories:

| Category | Stored slug |
| --- | --- |
| Pungi Plastic | `pungute-plastic` |
| Pungute Mici | `pungi-mici` |
| Pungi Curierat | `pungi-curierat` |
| Pungi cadou din plastic | `/pungi-cadou` |

Also review these bags whose primary category is empty:

- `punga-maci-fara-maner-40x50` — Pungi cu imprimeu floarea-soarelui 40 × 50 cm – mâner cu buclă.
- `maci-fara-maner-40-50` — Pungi cu imprimeu maci 40 × 50 cm – mâner decupat.
- `punga-traditional-romanesc-25x30` — Pungi cu model tradițional românesc – model 1 – 25 × 30 cm – mâner cu buclă.

In Products, use Ecotaxă → “Se aplică — inclusă în preț” only after confirmation;
“Nu se aplică” records a confirmed exclusion. New products default to “De confirmat”.
If variants differ in applicability, do not enable the product-wide flag; a variant-level
classification would need a follow-up. The selector never adds a surcharge.

## Other unresolved content

- The supplied returns address does not establish the physical showroom address.
  Existing About copy identifies Dragonul Roșu 7, stands 388–442, Str. Drumul Gării 1–10;
  the CMS About body still has a stand-number placeholder. Confirm these showroom
  details separately. They were not replaced with the registered office or returns address.
- Unrelated terms placeholders (payment, delivery, withdrawal procedures, effective
  date and others) remain. This change fills the supplied business facts and the two
  requested pricing statements, without inventing commercial/legal policies.

## Verification

- TypeScript: `npx tsc --noEmit` passed.
- Production client/SSR/Nitro build: `npm run build` passed; existing dependency,
  deprecated inputValidator and bundle-size warnings remain.
- Node suite: `node --test src/lib/*.test.ts` passed, including new explicit-flag and
  unchanged-price/checkout regression cases.
- Rendered the actual PriceNotice component for true/false/null/missing attributes:
  one label each, eco-tax wording only for true. This is a synthetic positive case;
  no real product's eco-tax applicability has been verified.
- Applied the SQL twice in an isolated PGlite database loaded with the public snapshot:
  all 63 prices and settings unchanged, no eco-tax assignments, corrected company
  fields, distinct addresses, and each terms pricing statement appearing once.
- Browser: inspected the catalog at 390 × 844 and product detail at 1440 × 1000;
  price labels are readable below prices. Bubble-wrap detail displays 85.00 RON with
  VAT-only wording. Search for “Folie cu bule” returns two VAT-labelled cards. Shared
  ProductCard wiring also covers featured/recommended listings.
- Bag detail `punga-neagra-maner-decupat`: selecting the 50 × 60 cm variant changes
  the displayed price to the existing 63.52 RON and retains one VAT label. Related
  product cards also display VAT. Cart and guest checkout both show 63.52 RON subtotal
  + 30.00 RON shipping = 93.52 RON total, with no extra VAT or eco-tax charge.
- Preview images failed to load; visual checks cover the text/layout, not image delivery.
  The browser used the unchanged live CMS, so post-migration CMS changes were verified
  in the isolated database rather than deployed. No live checkout order was submitted.
- Changed application files pass ESLint. Full repository lint fails on existing CRLF/
  formatting issues and two pre-existing semantic errors: `prefer-const` in
  previewAuthStorage.ts and `no-explicit-any` in the generated Lovable consent route.
  Those unrelated files were left unchanged.
