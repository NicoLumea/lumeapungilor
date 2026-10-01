import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assignedCategories,
  belongsToCategory,
  productAvailableStock,
  toggleCategorySelection,
  type Product,
} from "./shop-types.ts";
import { buildSitemap } from "./sitemap.ts";

const plastic = { id: "plastic", slug: "pungi-plastic", name: "Pungi plastic" };
const handles = { id: "handles", slug: "pungi-cu-maner", name: "Pungi cu mâner" };

function sampleProduct(): Product {
  return {
    id: "product-1",
    slug: "punga-thank-you",
    name: "Pungă THANK YOU",
    description: null,
    category_id: plastic.id,
    sku: "SKU-1",
    price: 25,
    currency: "RON",
    selling_unit: "set",
    units_per_pack: null,
    min_order_qty: 1,
    qty_increment: 1,
    stock: 100,
    track_stock: true,
    status: "published",
    is_featured: false,
    is_archived: false,
    sort_order: 0,
    specs: [],
    created_at: "2026-10-02",
    updated_at: "2026-10-02",
    categories: plastic,
    product_categories: [
      { category_id: plastic.id, categories: plastic },
      { category_id: handles.id, categories: handles },
    ],
  };
}

test("one product appears in both categories without duplicating price, stock, or URL", () => {
  const product = sampleProduct();
  const catalog = [product];
  assert.deepEqual(assignedCategories(product), [plastic, handles]);
  assert.deepEqual(
    catalog.filter((item) => belongsToCategory(item, plastic.slug)),
    [product],
  );
  assert.deepEqual(
    catalog.filter((item) => belongsToCategory(item, handles.slug)),
    [product],
  );
  assert.equal(product.price, 25);
  assert.equal(productAvailableStock(product), 100);
  assert.equal(product.slug, "punga-thank-you");
  assert.equal(catalog.filter((item) => item.name.includes("THANK YOU")).length, 1);
});

test("adding and removing memberships preserves the product and another category", () => {
  const product = sampleProduct();
  const one = toggleCategorySelection([plastic.id], plastic.id, handles.id, true);
  assert.deepEqual(one, { categoryIds: [plastic.id, handles.id], primaryId: plastic.id });
  const two = toggleCategorySelection(one.categoryIds, one.primaryId, plastic.id, false);
  assert.deepEqual(two, { categoryIds: [handles.id], primaryId: handles.id });
  assert.equal(product.id, "product-1");
  assert.equal(product.stock, 100);
});

test("legacy single category remains available after backfill and canonical sitemap is unique", () => {
  const legacy = sampleProduct();
  legacy.product_categories = [];
  assert.deepEqual(assignedCategories(legacy), [plastic]);
  const sitemap = buildSitemap(
    [
      { slug: plastic.slug, updated_at: null },
      { slug: handles.slug, updated_at: null },
    ],
    [{ slug: legacy.slug, updated_at: null }],
  );
  assert.equal((sitemap.match(/\/produs\/punga-thank-you<\/loc>/g) ?? []).length, 1);
  assert.match(sitemap, /\/categorie\/pungi-plastic<\/loc>/);
  assert.match(sitemap, /\/categorie\/pungi-cu-maner<\/loc>/);
});
