import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { PDFDocument, PDFName } from "pdf-lib";
import { cleanComplaintImage } from "./complaint-image.server.ts";
import { validateInvoicePdf } from "./invoice-pdf.server.ts";

test("normalized PNGs are decoded and rebuilt without metadata", async () => {
  const original = await sharp({
    create: { width: 1600, height: 10, channels: 3, background: "red" },
  })
    .withExif({ IFD0: { Artist: "private data" } })
    .png()
    .toBuffer();
  const clean = await cleanComplaintImage(original, "image/png");
  const metadata = await sharp(clean).metadata();
  assert.equal(metadata.format, "png");
  assert.equal(metadata.width, 1600);
  assert.equal(metadata.exif, undefined);
});
test("renamed executables, signature-only files, empty PNG and MIME mismatch fail", async () => {
  for (const bytes of [
    Buffer.from("MZ fake exe"),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.alloc(0),
  ])
    await assert.rejects(cleanComplaintImage(bytes, "image/png"));
  const jpg = await sharp({ create: { width: 2, height: 2, channels: 3, background: "blue" } })
    .jpeg()
    .toBuffer();
  await assert.rejects(cleanComplaintImage(jpg, "image/png"));
});
test("oversized pixel dimensions and uploads are rejected", async () => {
  const huge = await sharp({
    create: { width: 5000, height: 5000, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await assert.rejects(cleanComplaintImage(huge, "image/png"));
  await assert.rejects(cleanComplaintImage(Buffer.alloc(5 * 1024 * 1024 + 1), "image/png"));
});
test("valid invoice preserved, disguised non-PDF and active nested actions rejected", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  await validateInvoicePdf(await pdf.save());
  await assert.rejects(validateInvoicePdf(Buffer.from("MZ executable renamed.pdf")));
  pdf.catalog.set(PDFName.of("Names"), pdf.context.obj({ JavaScript: { Names: [] } }));
  await assert.rejects(validateInvoicePdf(await pdf.save()), /acțiuni/);
});
