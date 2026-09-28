import assert from "node:assert/strict";
import test from "node:test";
import { restoreSupportMessages, supportMessageBody, supportSubject } from "./support-widget.ts";

test("builds a concise subject for each support topic", () => {
  assert.equal(supportSubject("order"), "Widget suport — Am o întrebare despre o comandă");
  assert.equal(supportSubject(null), "Widget suport — Mesaj general");
});

test("adds only explicit safe page, product and order context", () => {
  const body = supportMessageBody("Aveți acest model și pe altă dimensiune?", {
    route: "/produs/punga-alba",
    product: { id: "product-1", name: "Pungă albă" },
    order: { id: "order-1", number: "LP-1001" },
  });

  assert.match(body, /Pagină: \/produs\/punga-alba/);
  assert.match(body, /Produs: Pungă albă \(product-1\)/);
  assert.match(body, /Comandă selectată: LP-1001 \(order-1\)/);
  assert.doesNotMatch(body, /browser|location|fingerprint/i);
});

test("restores only valid, bounded same-session messages", () => {
  const valid = {
    id: "message-1",
    role: "customer",
    text: "Bună ziua",
    createdAt: "2026-09-28T12:00:00.000Z",
  };
  const restored = restoreSupportMessages(JSON.stringify([valid, { role: "unknown" }]));

  assert.deepEqual(restored, [valid]);
  assert.deepEqual(restoreSupportMessages("not-json"), []);
});
