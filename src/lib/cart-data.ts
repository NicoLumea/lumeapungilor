export type CartLine = { productId: string; variantId: string | null; qty: number };

export const CART_STORAGE_KEY = "lp-cart-v2";
export const MAX_CART_LINES = 100;
export const MAX_QTY = 100000;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validQty(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= MAX_QTY;
}

export function cartKey(line: Pick<CartLine, "productId" | "variantId">): string {
  return `${line.productId}:${line.variantId ?? "standard"}`;
}

export function normalizeCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const merged = new Map<string, CartLine>();
  for (const candidate of value.slice(0, MAX_CART_LINES * 2)) {
    if (!candidate || typeof candidate !== "object") continue;
    const row = candidate as Record<string, unknown>;
    if (typeof row["productId"] !== "string" || !uuid.test(row["productId"])) continue;
    if (
      row["variantId"] !== null &&
      row["variantId"] !== undefined &&
      (typeof row["variantId"] !== "string" || !uuid.test(row["variantId"]))
    )
      continue;
    if (!validQty(row["qty"])) continue;
    const line: CartLine = {
      productId: row["productId"],
      variantId: (row["variantId"] as string | null) ?? null,
      qty: row["qty"],
    };
    const key = cartKey(line);
    const previous = merged.get(key);
    if (!previous && merged.size >= MAX_CART_LINES) continue;
    merged.set(key, { ...line, qty: Math.min(MAX_QTY, (previous?.qty ?? 0) + line.qty) });
  }
  return [...merged.values()];
}

export function parseCartStorage(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const payload: unknown = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || (payload as { version?: unknown }).version !== 2)
      return [];
    return normalizeCart((payload as { lines?: unknown }).lines);
  } catch {
    return [];
  }
}

export function addCartLine(lines: CartLine[], line: CartLine): CartLine[] {
  if (!validQty(line.qty)) return lines;
  return normalizeCart([...lines, line]);
}

export function updateCartQty(
  lines: CartLine[],
  productId: string,
  variantId: string | null,
  qty: number,
): CartLine[] {
  if (!validQty(qty)) return lines;
  return lines.map((line) =>
    line.productId === productId && line.variantId === variantId ? { ...line, qty } : line,
  );
}
