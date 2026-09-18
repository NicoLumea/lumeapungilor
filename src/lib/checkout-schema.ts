import { z } from "zod";
import { ROMANIAN_COUNTIES } from "./counties";

const required = (label: string, max: number) =>
  z.string().trim().min(1, `Completează ${label}.`).max(max, `${label} este prea lung.`);
const optional = (max: number) => z.string().trim().max(max).default("");
const county = z
  .string()
  .trim()
  .refine(
    (value) => ROMANIAN_COUNTIES.includes(value as (typeof ROMANIAN_COUNTIES)[number]),
    "Alege un județ din listă.",
  );
const postal = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Codul poștal trebuie să aibă 6 cifre.");
const phone = z
  .string()
  .trim()
  .refine((value) => {
    const digits = value.replace(/[\s().-]/g, "");
    return /^(?:\+40|0040|0)\d{9}$/.test(digits);
  }, "Introdu un număr de telefon românesc valid.");

export const checkoutCustomerSchema = z
  .object({
    contact_name: required("numele și prenumele", 120).refine(
      (value) => value.includes(" "),
      "Introdu numele și prenumele.",
    ),
    email: z.string().trim().email("Introdu o adresă de e-mail validă.").max(200),
    phone,
    company_name: optional(160),
    cui: optional(40),
    reg_com: optional(60),
    delivery_address: required("adresa de livrare", 400),
    city: required("localitatea", 120),
    county,
    postal_code: postal,
    delivery_instructions: optional(1000),
    same_as_delivery: z.boolean(),
    billing_address: optional(400),
    billing_city: optional(120),
    billing_county: z.string().trim(),
    billing_postal_code: z.string().trim(),
  })
  .superRefine((value, context) => {
    if (value.same_as_delivery) return;
    if (!value.billing_address)
      context.addIssue({
        code: "custom",
        path: ["billing_address"],
        message: "Completează adresa de facturare.",
      });
    if (!value.billing_city)
      context.addIssue({
        code: "custom",
        path: ["billing_city"],
        message: "Completează localitatea de facturare.",
      });
    if (!ROMANIAN_COUNTIES.includes(value.billing_county as (typeof ROMANIAN_COUNTIES)[number])) {
      context.addIssue({
        code: "custom",
        path: ["billing_county"],
        message: "Alege județul de facturare.",
      });
    }
    if (!/^\d{6}$/.test(value.billing_postal_code)) {
      context.addIssue({
        code: "custom",
        path: ["billing_postal_code"],
        message: "Codul poștal de facturare trebuie să aibă 6 cifre.",
      });
    }
  });

export type CheckoutCustomer = z.infer<typeof checkoutCustomerSchema>;

export function normalizedCustomer(customer: CheckoutCustomer) {
  return {
    ...customer,
    email: customer.email.toLowerCase(),
    billing_address: customer.same_as_delivery
      ? customer.delivery_address
      : customer.billing_address,
    billing_city: customer.same_as_delivery ? customer.city : customer.billing_city,
    billing_county: customer.same_as_delivery ? customer.county : customer.billing_county,
    billing_postal_code: customer.same_as_delivery
      ? customer.postal_code
      : customer.billing_postal_code,
  };
}
