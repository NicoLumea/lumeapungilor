import { describe, expect, it } from "vitest";
import { fromBani, toBani, vatBani } from "./money";

describe("RON minor-unit calculations", () => {
  it("parses database decimals exactly", () => {
    expect(toBani("12.34")).toBe(1234);
    expect(toBani("0.09")).toBe(9);
    expect(toBani("12.3")).toBe(1230);
    expect(fromBani(1234)).toBe(12.34);
    expect(() => toBani("12.345")).toThrow();
  });

  it("calculates line totals and VAT using integer bani", () => {
    const subtotal = toBani("19.99") * 3;
    const shipping = toBani("15.00");
    expect(subtotal).toBe(5997);
    expect(vatBani(subtotal + shipping, 19)).toBe(1424);
    expect(fromBani(subtotal + shipping + vatBani(subtotal + shipping, 19))).toBe(89.21);
  });
});
