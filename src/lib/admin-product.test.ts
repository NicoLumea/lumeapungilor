import assert from "node:assert/strict";
import test from "node:test";
import { buildProductSaveInput, type AdminProductDraft } from "./admin-product.ts";

function draft(overrides: Partial<AdminProductDraft> = {}): AdminProductDraft {
  return {
    name: "  Pungi verzi  ",
    slug: "",
    description: "  Descriere  ",
    category_id: "",
    sku: " SKU-1 ",
    price: "12,50",
    selling_unit: "set",
    units_per_pack: "50",
    min_order_qty: 1,
    qty_increment: 1,
    stock: 10,
    track_stock: true,
    status: "draft",
    is_featured: false,
    is_archived: false,
    sort_order: 0,
    specs: [{ label: " Material ", value: " LDPE " }],
    images: [
      { url: "one.webp", alt: " Prima ", isPrimary: false },
      { id: "image-2", url: "two.webp", alt: "", isPrimary: false },
    ],
    variants: [{ name: " Mare ", sku: " V-1 ", price: "13,75", stock: 4 }],
    ...overrides,
  };
}

test("normalizes the full product payload and selects one primary image", () => {
  const result = buildProductSaveInput(draft());
  assert.equal(result.product["name"], "Pungi verzi");
  assert.equal(result.product["slug"], "pungi-verzi");
  assert.equal(result.product["price"], 12.5);
  assert.equal(result.product["units_per_pack"], 50);
  assert.deepEqual(result.product["specs"], [{ label: "Material", value: "LDPE" }]);
  assert.equal(result.images[0]?.["is_primary"], true);
  assert.equal(result.images[1]?.["is_primary"], false);
  assert.equal(result.variants[0]?.["price"], 13.75);
});

test("rejects values that would cause a partial or invalid database save", () => {
  assert.throws(() => buildProductSaveInput(draft({ price: "abc" })), /Prețul/);
  assert.throws(() => buildProductSaveInput(draft({ stock: -1 })), /Stocul/);
  assert.throws(() => buildProductSaveInput(draft({ units_per_pack: "2.5" })), /Bucățile/);
  assert.throws(
    () =>
      buildProductSaveInput(
        draft({
          images: [
            { url: "same.webp", alt: "", isPrimary: false },
            { url: "same.webp", alt: "", isPrimary: false },
          ],
        }),
      ),
    /mai multe ori/,
  );
});
