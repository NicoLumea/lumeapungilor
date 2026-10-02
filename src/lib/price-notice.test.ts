import assert from "node:assert/strict";
import test from "node:test";
import { priceNotice } from "./price-notice.ts";
import { calculateOrderTotals } from "./order-totals.ts";

test("eco-tax notice requires explicit confirmation, never a category or product name", () => {
  assert.equal(priceNotice({ eco_tax_applicable: true }), "TVA și ecotaxă incluse");
  assert.equal(priceNotice({}), "TVA inclus");
  for (const eco_tax_applicable of [false, null]) {
    assert.equal(priceNotice({ eco_tax_applicable }), "TVA inclus");
  }
  const unclassifiedBag = { name: "Pungă din plastic", category: "pungute-plastic" };
  assert.equal(priceNotice({ ...unclassifiedBag, eco_tax_applicable: null }), "TVA inclus");
});

test("price notices leave bag, bubble wrap and tablecloth prices and checkout totals unchanged", () => {
  for (const price of [33.27, 85, 37]) {
    for (const eco_tax_applicable of [true, false, null]) {
      const product = Object.freeze({ price, eco_tax_applicable });
      const before = calculateOrderTotals(product.price * 2, 30, null, null);
      priceNotice(product);
      assert.equal(product.price, price);
      assert.deepEqual(calculateOrderTotals(product.price * 2, 30, null, null), before);
      assert.equal(before.tax, 0);
      assert.equal(before.total, Math.round((price * 2 + 30) * 100) / 100);
    }
  }
});
