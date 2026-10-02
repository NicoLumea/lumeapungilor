import assert from "node:assert/strict";
import test from "node:test";
import { imageVariantPath, imageVariantSrcSet, imageVariantUrl } from "./image-variants.ts";

test("private originals get stable width-specific URLs and storage paths", () => {
  const path = "products/bag photo.png";
  assert.equal(imageVariantPath(path, 320), "_variants/v1/w320/products/bag photo.png.webp");
  assert.equal(imageVariantUrl(path, 320), "/api/public/img/products/bag%20photo.png?w=320");
  assert.equal(
    imageVariantSrcSet(path, [320, 640]),
    "/api/public/img/products/bag%20photo.png?w=320 320w, /api/public/img/products/bag%20photo.png?w=640 640w",
  );
});

test("external and animated/vector images continue to use their originals", () => {
  assert.equal(imageVariantUrl("https://example.com/bag.jpg", 320), "https://example.com/bag.jpg");
  assert.equal(imageVariantSrcSet("https://example.com/bag.jpg", [320, 640]), undefined);
  assert.equal(imageVariantUrl("animated.gif", 320), "/api/public/img/animated.gif");
  assert.equal(imageVariantSrcSet("animated.gif", [320, 640]), undefined);
});
