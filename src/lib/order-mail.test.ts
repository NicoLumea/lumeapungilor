import test from "node:test";
import assert from "node:assert/strict";
import {
  orderMailText,
  mailtoUrl,
  emlDraft,
  WITHDRAWAL_FORM,
  orderStatusMailKind,
} from "./order-mail.ts";
import type { ConfirmationOrder } from "./order-confirmation.server";
const order = {
  order_number: "LP-TEST",
  contact_name: "Ana",
  email: "ana@example.test",
  phone: "000",
  company_name: "Firma",
  cui: "RO123",
  reg_com: "J123",
  delivery_address: "Str. Exemplu 1",
  billing_address: "Str. Exemplu 2",
  city: "Buftea",
  county: "Ilfov",
  postal_code: "000000",
  currency: "RON",
  subtotal: 100,
  shipping_total: 30,
  tax_total: 17.36,
  total: 130,
  payment_method: "cash",
  order_items: [
    {
      product_name: "Pungi",
      variant_name: "roșii",
      sku: "test",
      quantity: 2,
      unit_price: 50,
      line_total: 100,
    },
  ],
} as ConfirmationOrder;
test("acceptance includes recorded prices, items, address and no double tax", () => {
  const m = orderMailText(order, "acceptance", "");
  for (const s of [
    "2 × 50.00 RON = 100.00 RON",
    "Total: 130.00 RON",
    "roșii",
    "Str. Exemplu 1",
    "Str. Exemplu 2",
    "RO123",
    "numerar",
    "includ TVA",
  ])
    assert.ok(m.body.includes(s));
  assert.equal(order.total, 130);
});
test("dispatch distinguishes invoice pending from attached invoice", () => {
  assert.match(orderMailText(order, "dispatch", "AWB1").body, /AWB: AWB1/);
  assert.match(orderMailText(order, "dispatch", "").body, /transmisă separat/);
  assert.match(orderMailText(order, "dispatch", "AWB1", "INV1").body, /Factura INV1 este atașată/);
});
test("draft is passive MIME, includes withdrawal attachment and encodes mailto", () => {
  const m = {
    id: "test",
    recipient: "ana@example.test",
    ...orderMailText(order, "acceptance", ""),
    attachments: [{ name: "formular-retragere.txt", text: WITHDRAWAL_FORM }],
  };
  const eml = emlDraft(m);
  assert.match(eml, /X-Unsent: 1/);
  assert.match(eml, /filename="formular-retragere.txt"/);
  assert.ok(!eml.includes("text/html"));
  assert.ok(mailtoUrl(m).includes("%40"));
});

test("only confirmed and in-delivery statuses select an email draft", () => {
  assert.equal(orderStatusMailKind("confirmat"), "acceptance");
  assert.equal(orderStatusMailKind("in_livrare"), "dispatch");
  for (const status of ["nou", "finalizat", "anulat", "invoice", "unknown"])
    assert.equal(orderStatusMailKind(status), undefined);
});
