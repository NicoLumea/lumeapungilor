/** Authoritative public seller identity; the hosted company row still contains retired details. */
export const COMPANY_LEGAL = {
  name: "DEKORAMA IMPORT SRL",
  registeredOffice: "Str. Agricultori nr. 88, Buftea, județul Ilfov, România",
  streetAddress: "Str. Agricultori nr. 88",
  city: "Buftea",
  county: "Ilfov",
  country: "RO",
  cui: "RO38393721",
  tradeRegisterNumber: "J2017005349230",
  vatStatement: "Societatea este plătitoare de TVA.",
} as const;

// Matches the existing verified public CMS value; do not infer or fabricate missing digits.
export const COMPANY_PHONE = "0765 514 422";
export const SUPPORT_EMAIL = "contact@lumeapungilor.ro";
