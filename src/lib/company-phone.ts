/** Shared Romanian contact-link formatting for the storefront and structured data. */
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
