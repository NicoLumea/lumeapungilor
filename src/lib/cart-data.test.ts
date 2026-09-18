import { describe, expect, it } from "vitest";
import { addCartLine, normalizeCart, parseCartStorage, updateCartQty } from "./cart-data";

const productId = "9bffdf1a-239d-44e9-a878-bce8ed6beb1f";
const otherId = "7ab58a2f-8f53-40d0-85c9-19329c5aa463";
const variantId = "fb5a6649-44e5-4247-ae81-54f67e53d918";

describe("cart persistence", () => {
  it("recovers from malformed storage and ignores untrusted fields", () => {
    expect(parseCartStorage("{")).toEqual([]);
    expect(parseCartStorage(JSON.stringify({ version: 99, lines: [] }))).toEqual([]);
    expect(
      parseCartStorage(
        JSON.stringify({
          version: 2,
          lines: [{ productId, variantId: null, qty: 2, price: 0.01 }],
        }),
      ),
    ).toEqual([{ productId, variantId: null, qty: 2 }]);
  });

  it("merges only identical product and variation lines", () => {
    const lines = normalizeCart([
      { productId, variantId, qty: 2 },
      { productId, variantId, qty: 3 },
      { productId, variantId: null, qty: 1 },
      { productId: otherId, variantId: null, qty: 1 },
    ]);
    expect(lines).toHaveLength(3);
    expect(lines[0]?.qty).toBe(5);
    expect(addCartLine(lines, { productId, variantId, qty: 1 })[0]?.qty).toBe(6);
  });

  it("rejects malformed, fractional, negative and oversized quantities", () => {
    expect(
      normalizeCart([
        { productId, variantId, qty: 0 },
        { productId, variantId, qty: -1 },
        { productId, variantId, qty: 1.5 },
        { productId, variantId, qty: "2" },
        { productId, variantId, qty: 100001 },
      ]),
    ).toEqual([]);
    const original = [{ productId, variantId, qty: 2 }];
    expect(updateCartQty(original, productId, variantId, Number.NaN)).toEqual(original);
    expect(updateCartQty(original, productId, variantId, 4)[0]?.qty).toBe(4);
  });
});
