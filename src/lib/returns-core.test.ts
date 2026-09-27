import test from "node:test";
import assert from "node:assert/strict";
import { imageSignatureMatches, isPaidStatus, validRequestedQuantity } from "./returns-core.ts";

test("acceptă numai cantități întregi în limita cumpărată", () => {
  assert.equal(validRequestedQuantity(2, 3), true);
  assert.equal(validRequestedQuantity(4, 3), false);
  assert.equal(validRequestedQuantity(0, 3), false);
  assert.equal(validRequestedQuantity(1.5, 3), false);
});

test("recunoaște numai stările de plată finalizată", () => {
  assert.equal(isPaidStatus("platit"), true);
  assert.equal(isPaidStatus("captured"), true);
  assert.equal(isPaidStatus("in_asteptare"), false);
  assert.equal(isPaidStatus("neplatit"), false);
});

test("verifică semnătura reală a imaginilor", () => {
  assert.equal(imageSignatureMatches(Uint8Array.from([0xff, 0xd8, 0xff]), "image/jpeg"), true);
  assert.equal(imageSignatureMatches(Uint8Array.from([77, 90, 0, 0]), "image/jpeg"), false);
  assert.equal(
    imageSignatureMatches(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"),
    true,
  );
});
