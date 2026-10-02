import assert from "node:assert/strict";
import { test } from "node:test";
import {
  sortCatalogProducts,
  sortCategoryProducts,
  type CategoryMembership,
} from "./category-sorting.ts";
import type { Product } from "./shop-types.ts";

function product(id: string, createdAt: string): Product {
  return {
    id,
    slug: `produs-${id}`,
    name: `Produs ${id}`,
    description: null,
    category_id: null,
    sku: null,
    price: 10,
    currency: "RON",
    selling_unit: "bucată",
    units_per_pack: null,
    min_order_qty: 1,
    qty_increment: 1,
    stock: 1,
    track_stock: true,
    status: "published",
    is_featured: false,
    is_archived: false,
    sort_order: 0,
    specs: [],
    created_at: createdAt,
    updated_at: createdAt,
  };
}

test("ranked products lead and null, missing, or legacy order never hides products", () => {
  const products = [
    product("new", "2026-10-03"),
    product("ranked", "2026-10-01"),
    product("legacy", "2026-09-01"),
    product("unranked", "2026-10-02"),
  ];
  const memberships: CategoryMembership[] = [
    { product_id: "new", sort_order: null, created_at: "2026-10-03" },
    { product_id: "ranked", sort_order: 0, created_at: "2026-10-01" },
    { product_id: "unranked", created_at: "2026-10-02" },
  ];
  assert.deepEqual(
    sortCategoryProducts(products, memberships).map((item) => item.id),
    ["ranked", "legacy", "unranked", "new"],
  );
});

test("one product has independent positions in different categories", () => {
  const products = [product("a", "2026-10-01"), product("b", "2026-10-02")];
  const categoryA = [
    { product_id: "a", sort_order: 0 },
    { product_id: "b", sort_order: 8 },
  ];
  const categoryB = [
    { product_id: "a", sort_order: 8 },
    { product_id: "b", sort_order: 0 },
  ];
  assert.deepEqual(
    sortCategoryProducts(products, categoryA).map((item) => item.id),
    ["a", "b"],
  );
  assert.deepEqual(
    sortCategoryProducts(products, categoryB).map((item) => item.id),
    ["b", "a"],
  );
  assert.equal(products[0]?.slug, "produs-a");
  assert.equal(products[0]?.stock, 1);
});

test("renaming products or categories does not change ID-based ranking", () => {
  const a = product("a", "2026-10-01");
  const b = product("b", "2026-10-02");
  const relationships = [
    { product_id: "a", sort_order: 1 },
    { product_id: "b", sort_order: 0 },
  ];
  a.name = "Nume nou";
  a.categories = { id: "category-id", slug: "slug-nou", name: "Categorie redenumită" };
  assert.deepEqual(
    sortCategoryProducts([a, b], relationships).map((item) => item.id),
    ["b", "a"],
  );
  assert.equal(a.slug, "produs-a");
});

test("duplicate rows cannot produce duplicate product cards", () => {
  const a = product("a", "2026-10-01");
  assert.deepEqual(
    sortCategoryProducts([a, a], [{ product_id: "a", sort_order: null }]).map((item) => item.id),
    ["a"],
  );
});

test("price sorting overrides and default restores category order", () => {
  const a = product("a", "2026-10-01");
  const b = product("b", "2026-10-02");
  a.price = 30;
  b.price = 10;
  const categoryOrder = sortCategoryProducts(
    [a, b],
    [
      { product_id: "a", sort_order: 0 },
      { product_id: "b", sort_order: 1 },
    ],
  );
  assert.deepEqual(
    sortCatalogProducts(categoryOrder, "pret-asc").map((item) => item.id),
    ["b", "a"],
  );
  assert.deepEqual(
    sortCatalogProducts(categoryOrder, "pret-desc").map((item) => item.id),
    ["a", "b"],
  );
  assert.deepEqual(
    sortCatalogProducts(categoryOrder, "default").map((item) => item.id),
    ["a", "b"],
  );
});
