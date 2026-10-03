import { PDFDocument, PDFDict, PDFName, PDFArray, PDFStream } from "pdf-lib";

/** Keep fiscal original bytes (including signatures), reject active/embedded content. */
export async function validateInvoicePdf(bytes: Uint8Array) {
  if (
    bytes.length < 8 ||
    bytes.length > 10 * 1024 * 1024 ||
    new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-"
  )
    throw new Error("PDF invalid (maximum 10 MB).");
  const pdf = await PDFDocument.load(bytes, { throwOnInvalidObject: true });
  if (pdf.isEncrypted || pdf.getPageCount() < 1 || pdf.getPageCount() > 50)
    throw new Error("PDF protejat sau prea multe pagini (maximum 50).");
  const forbidden = new Set([
    "JS",
    "JavaScript",
    "OpenAction",
    "AA",
    "A",
    "Launch",
    "EmbeddedFiles",
    "EF",
    "RichMedia",
    "XFA",
    "SubmitForm",
    "ImportData",
  ]);
  const visited = new Set<unknown>();
  function inspect(object: unknown) {
    if (visited.has(object)) return;
    visited.add(object);
    if (object instanceof PDFStream) inspect(object.dict);
    if (object instanceof PDFArray) object.asArray().forEach(inspect);
    if (object instanceof PDFDict) {
      for (const [key, value] of object.entries()) {
        if (
          forbidden.has(key.decodeText()) ||
          (value instanceof PDFName && forbidden.has(value.decodeText()))
        )
          throw new Error(
            "PDF-ul conține acțiuni sau fișiere încorporate. Exportă o copie simplă din programul de facturare.",
          );
        inspect(value);
      }
    }
  }
  for (const [, object] of pdf.context.enumerateIndirectObjects()) inspect(object);
}
