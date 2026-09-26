import assert from "node:assert/strict";
import test from "node:test";
import { primaryImage, sortedImages, type Product, type ProductImage } from "./shop-types.ts";

function image(id: string, sortOrder: number, isPrimary = false): ProductImage {
  return {
    id,
    product_id: "product",
    url: `${id}.webp`,
    alt: null,
    sort_order: sortOrder,
    is_primary: isPrimary,
    created_at: `2026-09-26T00:00:0${sortOrder}Z`,
    updated_at: `2026-09-26T00:00:0${sortOrder}Z`,
  };
}

function product(images: ProductImage[]): Product {
  return { product_images: images } as Product;
}

test("gallery order is independent from the primary image", () => {
  const gallery = product([image("cover", 2, true), image("first", 0), image("second", 1)]);

  assert.deepEqual(
    sortedImages(gallery).map(({ id }) => id),
    ["first", "second", "cover"],
  );
  assert.equal(primaryImage(gallery)?.id, "cover");
});

test("the first ordered image is a safe fallback when no primary flag exists", () => {
  const gallery = product([image("later", 1), image("first", 0)]);

  assert.equal(primaryImage(gallery)?.id, "first");
});
