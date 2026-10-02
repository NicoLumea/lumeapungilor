import assert from "node:assert/strict";
import test from "node:test";
import { hasGuestReturnProof } from "./guest-return-access.ts";

const base = {
  orderEmail: "alice@example.com",
  suppliedEmail: "alice@example.com",
  storedTokenHash: "stored-secret-hash",
  suppliedTokenHash: null,
  verifiedAccountEmail: null,
};

test("knowing the order number and email is insufficient", () => {
  assert.equal(hasGuestReturnProof(base), false);
});
test("only the matching checkout secret authorizes the guest", () => {
  assert.equal(hasGuestReturnProof({ ...base, suppliedTokenHash: "stored-secret-hash" }), true);
  assert.equal(hasGuestReturnProof({ ...base, suppliedTokenHash: "another-order-secret" }), false);
  assert.equal(hasGuestReturnProof({ ...base, storedTokenHash: null }), false);
});
test("verified account ownership permits recovery on another device", () => {
  assert.equal(hasGuestReturnProof({ ...base, verifiedAccountEmail: " ALICE@example.com " }), true);
  assert.equal(hasGuestReturnProof({ ...base, verifiedAccountEmail: "bob@example.com" }), false);
});
test("email matching is literal even when a valid address contains underscores", () => {
  assert.equal(
    hasGuestReturnProof({
      ...base,
      suppliedEmail: "_____@example.com",
      suppliedTokenHash: "stored-secret-hash",
    }),
    false,
  );
  assert.equal(
    hasGuestReturnProof({
      ...base,
      orderEmail: "a_b@example.com",
      suppliedEmail: "a_b@example.com",
      verifiedAccountEmail: "a_b@example.com",
    }),
    true,
  );
});
