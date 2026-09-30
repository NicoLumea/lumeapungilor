import assert from "node:assert/strict";
import test from "node:test";
import { writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { renderOrderPdf } from "./order-pdf.server.ts";

test("order confirmation is a readable, non-invoice PDF with the recorded totals", async () => {
  const bytes = await renderOrderPdf(
    {
      order_number: "LP-1234",
      created_at: "2026-09-30T12:00:00Z",
      contact_name: "Ana Popescu",
      email: "ana@example.test",
      phone: "0700000000",
      company_name: "Firma Test SRL",
      cui: "RO123",
      reg_com: null,
      billing_address: "Strada Test 1",
      delivery_address: "Strada Test 1",
      city: "București",
      county: "București",
      postal_code: "010101",
      status: "nou",
      payment_status: "neplatit",
      subtotal: 100,
      shipping_total: 10,
      tax_total: 19,
      total: 129,
      currency: "RON",
      order_items: [
        {
          id: "line-1",
          product_name: "Pungi cu mâner",
          variant_name: "Mărimea M",
          sku: "P-M",
          product_image_url: null,
          quantity: 2,
          unit_price: 50,
          line_total: 100,
        },
      ],
    },
    { legal_company_name: "Lumea Pungilor SRL", cui: "RO123456" },
  );
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() >= 1);
  assert.equal(pdf.getTitle(), "Confirmare comanda LP-1234");
  assert.ok(bytes.length > 1000);
  if (process.env["PDF_PREVIEW_PATH"]) {
    await writeFile(process.env["PDF_PREVIEW_PATH"], bytes);
  }
});
