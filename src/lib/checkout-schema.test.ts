import { describe, expect, it } from "vitest";
import { checkoutCustomerSchema, normalizedCustomer } from "./checkout-schema";

const valid = {
  contact_name: "Ana Popescu",
  email: " ANA@EXAMPLE.RO ",
  phone: "+40 712 345 678",
  company_name: "",
  cui: "",
  reg_com: "",
  delivery_address: "Strada Exemplu 12, etaj 1",
  city: "Cluj-Napoca",
  county: "Cluj",
  postal_code: "400001",
  delivery_instructions: "",
  same_as_delivery: true,
  billing_address: "",
  billing_city: "",
  billing_county: "",
  billing_postal_code: "",
};

describe("checkout customer validation", () => {
  it("uses the delivery address for billing when selected", () => {
    const parsed = checkoutCustomerSchema.parse(valid);
    const normalized = normalizedCustomer(parsed);
    expect(normalized.billing_address).toBe(normalized.delivery_address);
    expect(normalized.billing_city).toBe("Cluj-Napoca");
    expect(normalized.email).toBe("ana@example.ro");
  });

  it("requires all separate billing fields", () => {
    const result = checkoutCustomerSchema.safeParse({ ...valid, same_as_delivery: false });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining([
          "billing_address",
          "billing_city",
          "billing_county",
          "billing_postal_code",
        ]),
      );
  });

  it("checks Romanian postal codes and telephone numbers", () => {
    expect(checkoutCustomerSchema.safeParse({ ...valid, postal_code: "123" }).success).toBe(false);
    expect(checkoutCustomerSchema.safeParse({ ...valid, phone: "abc" }).success).toBe(false);
    expect(checkoutCustomerSchema.safeParse({ ...valid, phone: "0712345678" }).success).toBe(true);
  });
});
