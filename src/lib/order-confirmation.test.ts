import assert from "node:assert/strict";
import test from "node:test";
import { isAuthorizedOrder } from "./order-access.ts";

test("customer A cannot read customer B order or its PDF", () => {
  assert.equal(isAuthorizedOrder("customer-a", "customer-a", null, null), true);
  assert.equal(isAuthorizedOrder("customer-a", "customer-b", null, null), false);
  assert.equal(isAuthorizedOrder("customer-a", null, "hash", "hash"), false);
});

test("guest confirmation requires its matching secret token hash", () => {
  assert.equal(isAuthorizedOrder(null, null, "hash-a", "hash-a"), true);
  assert.equal(isAuthorizedOrder(null, null, "hash-a", "hash-b"), false);
  assert.equal(isAuthorizedOrder(null, null, "hash-a", null), false);
  assert.equal(isAuthorizedOrder(null, "customer-a", null, null), false);
});
