import assert from "node:assert/strict";
import test from "node:test";
import {
  deliveryEstimate,
  recentPurchasedProductIds,
  repeatPurchaseLine,
} from "./order-experience.ts";
import type { Product } from "./shop-types.ts";

const product: Product = {
  id: "p1",
  slug: "p1",
  name: "Pungă",
  description: null,
  category_id: null,
  sku: null,
  price: 12,
  currency: "RON",
  selling_unit: "set",
  units_per_pack: null,
  min_order_qty: 3,
  qty_increment: 2,
  stock: 5,
  track_stock: true,
  status: "published",
  is_featured: false,
  is_archived: false,
  sort_order: 1,
  specs: [],
  created_at: "",
  updated_at: "",
  product_variants: [],
};

test("delivery estimate follows the published Bucharest policy", () => {
  assert.match(deliveryEstimate("București"), /1–2 zile lucrătoare/);
  assert.match(deliveryEstimate("Cluj-Napoca"), /aproximativ 3 zile lucrătoare/);
});

test("recent purchases are ordered, unique and bounded", () => {
  const orders = [
    { status: "finalizat", order_items: [{ product_id: "p1" }, { product_id: "p2" }] },
    { status: "confirmat", order_items: [{ product_id: "p1" }, { product_id: "p3" }] },
    { status: "anulat", order_items: [{ product_id: "p4" }] },
  ];
  assert.deepEqual(recentPurchasedProductIds(orders, 2), ["p1", "p2"]);
  assert.deepEqual(recentPurchasedProductIds(orders), ["p1", "p2", "p3"]);
});

test("repeat purchases use current minimum, stock and active variant state", () => {
  assert.deepEqual(repeatPurchaseLine(product, null), { productId: "p1", variantId: null, qty: 3 });
  assert.equal(repeatPurchaseLine({ ...product, stock: 2 }, null), null);
  assert.equal(repeatPurchaseLine({ ...product, is_archived: true }, null), null);
  assert.equal(
    repeatPurchaseLine(
      {
        ...product,
        variant_stock_tracked: true,
        product_variants: [
          {
            id: "v1",
            product_id: "p1",
            name: "Mic",
            sku: null,
            price: 14,
            stock: 1,
            sort_order: 0,
          },
        ],
      },
      "v1",
    ),
    null,
  );
  assert.equal(
    repeatPurchaseLine(
      {
        ...product,
        variant_stock_tracked: true,
        product_variants: [
          {
            id: "v1",
            product_id: "p1",
            name: "Mic",
            sku: null,
            price: 14,
            stock: 0,
            sort_order: 0,
          },
        ],
      },
      "v1",
    ),
    null,
  );
  assert.equal(
    repeatPurchaseLine(
      {
        ...product,
        product_variants: [
          {
            id: "v1",
            product_id: "p1",
            name: "Mic",
            sku: null,
            price: 14,
            stock: 5,
            sort_order: 0,
          },
        ],
      },
      "missing",
    ),
    null,
  );
});
