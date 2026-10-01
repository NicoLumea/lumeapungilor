import assert from "node:assert/strict";
import test from "node:test";
import { calculateOrderTotals } from "./order-totals.ts";

test("cash checkout includes the configured 30 RON delivery charge", () => {
  assert.deepEqual(calculateOrderTotals(200, 30, null, null), {
    subtotal: 200,
    shipping: 30,
    tax: 0,
    total: 230,
  });
});

test("a changed fee applies only when calculating a new checkout", () => {
  const oldOrder = calculateOrderTotals(200, 30, null, null);
  const nextOrder = calculateOrderTotals(200, 35, null, null);
  assert.equal(oldOrder.shipping, 30);
  assert.equal(oldOrder.total, 230);
  assert.equal(nextOrder.shipping, 35);
  assert.equal(nextOrder.total, 235);
});

test("free-shipping threshold and tax continue to work", () => {
  assert.deepEqual(calculateOrderTotals(200, 30, 200, 19), {
    subtotal: 200,
    shipping: 0,
    tax: 38,
    total: 238,
  });
});
