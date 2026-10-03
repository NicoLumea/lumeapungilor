import { COMPANY_LEGAL, SUPPORT_EMAIL, RETURNS_ADDRESS } from "./company-legal.ts";
import type { ConfirmationOrder } from "./order-confirmation.server";

export type MailKind = "acceptance" | "dispatch" | "invoice";
export type MailAttachment = { name: string; text: string };
export type OrderMail = {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  attachments: MailAttachment[];
  invoiceUrl?: string | undefined;
};
export const WITHDRAWAL_FORM = `FORMULAR DE RETRAGERE
Completați și trimiteți acest formular numai dacă doriți să vă retrageți din contract.
Către: ${COMPANY_LEGAL.name}, ${RETURNS_ADDRESS}, ${SUPPORT_EMAIL}
Vă informez/informăm prin prezenta cu privire la retragerea mea/noastră din contractul referitor la vânzarea următoarelor bunuri:
[Bunurile]
Comandate la / primite la: [data]
Numele consumatorului / consumatorilor: [numele]
Adresa consumatorului / consumatorilor: [adresa]
Semnătura consumatorului / consumatorilor (numai dacă formularul este notificat pe hârtie):
Data:
Ștergeți mențiunile inutile. Formularul este opțional; poate fi transmisă și o declarație neechivocă de retragere.`;

export function orderMailText(
  o: ConfirmationOrder,
  kind: MailKind,
  tracking: string,
  invoiceNumber?: string,
) {
  const money = (n: number) => `${Number(n).toFixed(2)} ${o.currency || "RON"}`;
  const subject =
    `${kind === "acceptance" ? "Acceptarea comenzii" : kind === "dispatch" ? "Comandă predată curierului" : "Factura comenzii"} ${o.order_number}`.replace(
      /[\r\n]/g,
      " ",
    );
  const summary = o.order_items
    .map(
      (i) =>
        `• ${i.product_name}${i.variant_name ? ` — ${i.variant_name}` : ""}${i.sku ? ` (SKU: ${i.sku})` : ""}\n  ${i.quantity} × ${money(i.unit_price)} = ${money(i.line_total)}`,
    )
    .join("\n");
  const body = `Bună ziua, ${o.contact_name}!\n\n${kind === "acceptance" ? "Am acceptat comanda dumneavoastră." : kind === "dispatch" ? "Am predat comanda dumneavoastră curierului DPD." : "Vă transmitem factura aferentă comenzii."}\n\nComanda: ${o.order_number}\n${summary}\n\nSubtotal: ${money(o.subtotal)}\nLivrare: ${money(o.shipping_total)}\nTotal: ${money(o.total)}\nPrețurile includ TVA și, pentru produsele supuse ecotaxei, ecotaxa.\nPlată: ${o.payment_method === "cash" ? "numerar" : o.payment_method}\n\nClient: ${o.contact_name}\nE-mail: ${o.email}\nTelefon: ${o.phone || "—"}\n${o.company_name ? `Firmă: ${o.company_name}\nCUI: ${o.cui || "—"}\nRegistrul Comerțului: ${o.reg_com || "—"}\n` : ""}Adresă de livrare: ${o.delivery_address || "—"}, ${[o.city, o.county, o.postal_code].filter(Boolean).join(", ")}\nAdresă de facturare: ${o.billing_address || o.delivery_address || "—"}\n\n${kind === "acceptance" ? "Atașăm termenii aplicabili comenzii, inclusiv informațiile de retragere, și formularul de retragere. Păstrați acest mesaj și documentele atașate." : kind === "dispatch" ? `Curier: DPD${tracking ? `\nAWB: ${tracking}` : "\nNumărul AWB va fi comunicat separat, când este disponibil."}` : ""}\n${invoiceNumber ? `Factura ${invoiceNumber} este atașată acestui mesaj.` : kind === "dispatch" ? "Factura va fi transmisă separat după emitere." : ""}\n\nLumea Pungilor\n${COMPANY_LEGAL.name}\n${SUPPORT_EMAIL}`;
  return { subject, body };
}

export function mailtoUrl(mail: Pick<OrderMail, "recipient" | "subject" | "body">) {
  return `mailto:${encodeURIComponent(mail.recipient)}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;
}

export function downloadText(name: string, text: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// UTF-8 MIME draft for long orders; attachments stay passive text, no HTML or scripts.
export function emlDraft(mail: OrderMail) {
  const b64 = (s: string) => {
    const bytes = new TextEncoder().encode(s);
    let binary = "";
    for (let n = 0; n < bytes.length; n += 8192)
      binary += String.fromCharCode(...bytes.slice(n, n + 8192));
    return (
      btoa(binary)
        .match(/.{1,76}/g)
        ?.join("\r\n") ?? ""
    );
  };
  const boundary = "lp_" + crypto.randomUUID();
  const part = (text: string, filename?: string) =>
    `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n${filename ? `Content-Disposition: attachment; filename="${filename}"\r\n` : ""}\r\n${b64(text)}\r\n`;
  return `From: ${SUPPORT_EMAIL}\r\nTo: ${mail.recipient.replace(/[\r\n]/g, "")}\r\nSubject: =?UTF-8?B?${b64(mail.subject).replace(/\r\n/g, "")}?=\r\nX-Unsent: 1\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n${part(mail.body)}${mail.attachments.map((a) => part(a.text, a.name)).join("")}--${boundary}--\r\n`;
}
