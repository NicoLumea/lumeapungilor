import { text, type ContentMap } from "@/lib/content";

export type CompanyInfo = {
  brandName: string | null;
  legalName: string | null;
  address: string | null;
  cui: string | null;
  tradeRegisterNumber: string | null;
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
    brandName: text(company, "brand_name") ?? text(company, "name"),
    legalName: text(company, "legal_company_name"),
    address: text(company, "registered_address") ?? text(company, "address"),
    cui: text(company, "cui"),
    tradeRegisterNumber: text(company, "trade_register_number") ?? text(company, "reg_com"),
    phonePrimary: text(company, "phone_primary"),
    phoneSecondary: text(company, "phone_secondary"),
    secondaryPhoneNote: text(company, "secondary_phone_note"),
    operatingDays: text(company, "operating_days"),
    operatingHours: text(company, "operating_hours"),
    sellerEnquiryHeading: text(company, "seller_enquiry_heading"),
    sellerEnquiryCopy: text(company, "seller_enquiry_copy"),
  };
}

export function telephoneHref(phone: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `tel:+40${digits.slice(1)}` : `tel:+${digits}`;
}

export function internationalTelephone(phone: string | null): string | undefined {
  if (!phone) return undefined;
  return phone.startsWith("0") ? `+40 ${phone.slice(1)}` : phone;
}