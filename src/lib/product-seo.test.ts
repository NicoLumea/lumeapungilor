import assert from "node:assert/strict";
import { test } from "node:test";
import type { Product } from "./shop-types.ts";
import {
  factualProductDescription,
  productBreadcrumbJsonLd,
  productImageAlt,
  productJsonLd,
} from "./product-seo.ts";

function product(): Product {
  return {
    id: "p1",
    slug: "punga-test-40x50",
    name: "Pungă test 40x50",
    description: null,
    category_id: "c1",
    sku: "TEST-1",
    price: 12.5,
    currency: "RON",
    selling_unit: "set",
    units_per_pack: 100,
    min_order_qty: 1,
    qty_increment: 1,
    stock: 0,
    track_stock: true,
    status: "published",
    is_featured: false,
    is_archived: false,
    sort_order: 0,
    specs: [{ label: "Dimensiuni", value: "40x50 cm" }],
    created_at: "2026-10-02",
    updated_at: "2026-10-02",
    categories: { id: "c1", slug: "/pungi-test", name: "Pungi test" },
    product_images: [
      {
        id: "i1",
        product_id: "p1",
        url: "products/test.webp",
        alt: "Pungă test văzută frontal",
        sort_order: 0,
        is_primary: true,
        created_at: "2026-10-02",
        updated_at: "2026-10-02",
      },
    ],
  };
}

test("Product JSON-LD uses only factual catalogue fields", () => {
  const schema = productJsonLd(product());
  assert.equal(schema["name"], "Pungă test 40x50");
  assert.equal(schema["sku"], "TEST-1");
  assert.deepEqual(schema["image"], [
    "https://lumeapungilor.lovable.app/api/public/img/products/test.webp",
  ]);
  assert.deepEqual(schema["offers"], {
    "@type": "Offer",
    url: "https://lumeapungilor.lovable.app/produs/punga-test-40x50",
    price: "12.50",
    priceCurrency: "RON",
    availability: "https://schema.org/OutOfStock",
  });
  assert.equal("aggregateRating" in schema, false);
  assert.equal("brand" in schema, false);
});

test("metadata and alt fallbacks use stored facts without inventing claims", () => {
  const sample = product();
  assert.equal(factualProductDescription(sample), "Pungă test 40x50. Dimensiuni: 40x50 cm");
  assert.equal(productImageAlt(sample), "Pungă test văzută frontal");
  sample.product_images![0]!.alt = null;
  assert.equal(productImageAlt(sample), sample.name);
});

test("breadcrumbs normalize only the public route, not the category identity", () => {
  const breadcrumb = productBreadcrumbJsonLd(product());
  const items = breadcrumb["itemListElement"] as Record<string, unknown>[];
  assert.equal(items[2]?.["item"], "https://lumeapungilor.lovable.app/categorie/pungi-test");
});
