import { text, type ContentMap } from "@/lib/content";
import { COMPANY_LEGAL, COMPANY_PHONE, RETURNS_ADDRESS } from "@/lib/company-legal";

export { COMPANY_PHONE, SUPPORT_EMAIL } from "@/lib/company-legal";

/** Official Romanian consumer-protection references (ANPC / SAL). */
export const CONSUMER_LINKS = {
  anpc: "https://anpc.ro/",
  sal: "https://reclamatiisal.anpc.ro/",
} as const;

export type CompanyInfo = {
  brandName: string | null;
  legalName: string | null;
  address: string | null;
  tradingAddress: string | null;
  returnsAddress: string;
  cui: string | null;
  tradeRegisterNumber: string | null;
  vatStatement: string;
  phonePrimary: string | null;
  phoneSecondary: string | null;
  secondaryPhoneNote: string | null;
  operatingDays: string | null;
  operatingHours: string | null;
  sellerEnquiryHeading: string | null;
  sellerEnquiryCopy: string | null;
};

export function companyInfo(content: ContentMap | undefined): CompanyInfo {
  const company = content?.["company"];
  return {
    brandName: text(company, "brand_name") ?? text(company, "name") ?? "Lumea Pungilor",
    legalName: COMPANY_LEGAL.name,
    address: text(company, "registered_address") ?? COMPANY_LEGAL.registeredOffice,
    tradingAddress: text(company, "trading_address"),
    returnsAddress: text(company, "returns_address") ?? RETURNS_ADDRESS,
    cui: COMPANY_LEGAL.cui,
    tradeRegisterNumber: COMPANY_LEGAL.tradeRegisterNumber,
    vatStatement: COMPANY_LEGAL.vatStatement,
    phonePrimary: text(company, "phone_primary") ?? COMPANY_PHONE,
    phoneSecondary: text(company, "phone_secondary"),
    secondaryPhoneNote: text(company, "secondary_phone_note"),
    operatingDays: text(company, "operating_days") ?? "Luni–Vineri",
    operatingHours: text(company, "operating_hours") ?? "07:00–15:00",
    sellerEnquiryHeading: text(company, "seller_enquiry_heading"),
    sellerEnquiryCopy: text(company, "seller_enquiry_copy"),
  };
}

export function telephoneHref(phone: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `tel:+40${digits.slice(1)}` : `tel:+${digits}`;
}

export function whatsappHref(phone: string | null): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `40${digits.slice(1)}`;
  if (!digits.startsWith("40")) digits = `40${digits}`;
  return `https://wa.me/${digits}`;
}

export function internationalTelephone(phone: string | null): string | undefined {
  if (!phone) return undefined;
  return phone.startsWith("0") ? `+40 ${phone.slice(1)}` : phone;
}
