import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ConfirmationOrder } from "./order-confirmation.server";
import { deliveryEstimate } from "./order-experience.ts";
import { COMPANY_LEGAL, COMPANY_PHONE, SUPPORT_EMAIL } from "./company-legal.ts";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 48;
const INK = rgb(0.17, 0.15, 0.13);
const MUTED = rgb(0.45, 0.42, 0.38);
const ACCENT = rgb(0.68, 0.55, 0.42);

// Built-in PDF fonts cannot encode Romanian diacritics. Transliterating only
// this document keeps the downloadable confirmation readable on every viewer.
function pdfText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[„“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/[^\x20-\x7e]/g, " ");
}

function money(value: number): string {
  return `${Number(value).toFixed(2)} RON`;
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = pdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(next, size) > width) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function renderOrderPdf(order: ConfirmationOrder): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Confirmare comanda ${order.order_number}`);
  pdf.setAuthor("Lumea Pungilor");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const nextPage = (needed: number) => {
    if (y - needed >= MARGIN + 30) return;
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };
  const line = (
    text: string,
    options?: { bold?: boolean; size?: number; color?: typeof INK; indent?: number },
  ) => {
    const font = options?.bold ? bold : regular;
    const size = options?.size ?? 10;
    const indent = options?.indent ?? 0;
    const rows = wrap(text, font, size, PAGE_WIDTH - 2 * MARGIN - indent);
    nextPage(rows.length * (size + 4));
    for (const row of rows) {
      page.drawText(row, { x: MARGIN + indent, y, size, font, color: options?.color ?? INK });
      y -= size + 4;
    }
  };
  const section = (title: string) => {
    nextPage(45);
    y -= 15;
    page.drawLine({
      start: { x: MARGIN, y: y + 9 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 9 },
      thickness: 0.7,
      color: ACCENT,
    });
    line(title, { bold: true, size: 11 });
    y -= 3;
  };

  line("LUMEA PUNGILOR", { bold: true, size: 20, color: ACCENT });
  y -= 7;
  line("CONFIRMARE COMANDA", { bold: true, size: 15 });
  line("Acest document confirma inregistrarea cererii de comanda. Nu este factura fiscala.", {
    size: 9,
    color: MUTED,
  });
  y -= 10;
  line(`Numar comanda: ${order.order_number}`, { bold: true });
  line(`Data: ${new Date(order.created_at).toLocaleDateString("ro-RO")}`);
  line(`Stare comanda: ${order.status} | Stare plata: ${order.payment_status}`);
  line(`Metoda de plata: ${order.payment_method === "cash" ? "Numerar" : "De confirmat"}`);
  line(deliveryEstimate(order.city));

  section("Vanzator");
  line(COMPANY_LEGAL.name);
  line(COMPANY_LEGAL.registeredOffice);
  line(`CUI: ${COMPANY_LEGAL.cui}`);
  line(`Registrul Comertului: ${COMPANY_LEGAL.tradeRegisterNumber}`);
  line(COMPANY_LEGAL.vatStatement);
  line(`Telefon: ${COMPANY_PHONE}`);
  line(`E-mail: ${SUPPORT_EMAIL}`);

  section("Client si livrare");
  line(order.contact_name, { bold: true });
  if (order.company_name) line(`Firma: ${order.company_name}`);
  if (order.cui) line(`CUI: ${order.cui}`);
  if (order.reg_com) line(`Registrul Comertului: ${order.reg_com}`);
  line(`E-mail: ${order.email}`);
  if (order.phone) line(`Telefon: ${order.phone}`);
  if (order.delivery_address) line(`Livrare: ${order.delivery_address}`);
  line([order.city, order.county, order.postal_code].filter(Boolean).join(", "));
  if (order.billing_address) line(`Facturare: ${order.billing_address}`);
  line(
    order.payment_method === "cash"
      ? "Plata in numerar la livrare; metoda de livrare va fi confirmata de echipa noastra."
      : "Metoda de livrare si metoda de plata vor fi confirmate de echipa noastra.",
    {
      size: 9,
      color: MUTED,
    },
  );

  section("Produse");
  for (const item of order.order_items) {
    nextPage(48);
    line(`${item.product_name}${item.variant_name ? ` - ${item.variant_name}` : ""}`, {
      bold: true,
    });
    line(`${item.quantity} x ${money(item.unit_price)} = ${money(item.line_total)}`, {
      size: 9,
      color: MUTED,
    });
    y -= 5;
  }

  section("Totaluri");
  line(`Subtotal: ${money(order.subtotal)}`);
  line(`Livrare: ${money(order.shipping_total)}`);
  line(`Taxe / TVA inregistrate: ${money(order.tax_total)}`);
  line(`Total: ${money(order.total)}`, { bold: true, size: 13 });
  y -= 12;
  line("Pentru intrebari privind comanda: contact@lumeapungilor.ro", { size: 9, color: MUTED });
  line("Pentru retururi si reclamatii foloseste fluxul dedicat de pe site.", {
    size: 9,
    color: MUTED,
  });

  const pages = pdf.getPages();
  for (const [index, sheet] of pages.entries()) {
    sheet.drawLine({
      start: { x: MARGIN, y: 38 },
      end: { x: PAGE_WIDTH - MARGIN, y: 38 },
      thickness: 0.5,
      color: ACCENT,
    });
    sheet.drawText(`Lumea Pungilor  |  ${order.order_number}  |  ${index + 1}/${pages.length}`, {
      x: MARGIN,
      y: 24,
      size: 8,
      font: regular,
      color: MUTED,
    });
  }
  return pdf.save();
}
