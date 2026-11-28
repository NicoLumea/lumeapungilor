import assert from "node:assert/strict";
import test from "node:test";
import { AGE_CONFIRMATION_ERROR, isAgeConfirmed } from "./checkout-age.ts";

test("only an explicit boolean true satisfies checkout age eligibility", () => {
  assert.equal(isAgeConfirmed(true), true);
  for (const invalid of [undefined, null, false, "true", "false", 1, 0, {}, [], "on"]) {
    assert.equal(isAgeConfirmed(invalid), false, String(invalid));
  }
});

test("server-side and frontend use the same Romanian eligibility message", () => {
  assert.equal(
    AGE_CONFIRMATION_ERROR,
    "Pentru a plasa comanda, trebuie să confirmați că aveți minimum 18 ani.",
  );
});
