export const RETURN_REASONS = [
  "damaged",
  "wrong_product",
  "wrong_quantity",
  "incomplete",
  "not_as_ordered",
  "other",
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];

export const RETURN_REASON_LABEL: Record<ReturnReason, string> = {
  damaged: "Produs deteriorat",
  wrong_product: "Produs greșit",
  wrong_quantity: "Cantitate incorectă",
  incomplete: "Produs incomplet",
  not_as_ordered: "Produs diferit față de comandă",
  other: "Alt motiv",
};

export const RETURN_STATUSES = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "awaiting_return",
  "return_received",
  "refund_pending",
  "refunded",
  "closed",
] as const;

export const RETURN_STATUS_LABEL: Record<string, string> = {
  submitted: "Trimisă",
  under_review: "În verificare",
  approved: "Aprobată",
  rejected: "Respinsă",
  awaiting_return: "În așteptarea returului",
  return_received: "Retur primit",
  refund_pending: "Rambursare în curs",
  refunded: "Rambursată",
  closed: "Închisă",
};

export const EVIDENCE_REASONS = new Set<ReturnReason>([
  "damaged",
  "wrong_product",
  "wrong_quantity",
  "incomplete",
  "not_as_ordered",
]);
export const RETURN_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_RETURN_IMAGES = 3;
export const MAX_RETURN_IMAGE_BYTES = 5 * 1024 * 1024;

export function isPaidStatus(status: string): boolean {
  return ["platit", "achitat", "paid", "captured", "succeeded", "completed"].includes(
    status.trim().toLowerCase(),
  );
}

export function validRequestedQuantity(requested: number, purchased: number): boolean {
  return Number.isInteger(requested) && requested > 0 && requested <= purchased;
}

export function imageSignatureMatches(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png")
    return (
      bytes.length >= 8 &&
      bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index])
    );
  if (mime === "image/webp")
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}
