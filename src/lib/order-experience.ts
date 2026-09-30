import { normalizeQty, type Product } from "./shop-types.ts";

export function deliveryEstimate(city: string | null): string {
  return city?.trim().toLocaleLowerCase("ro-RO") === "bucurești" ||
    city?.trim().toLowerCase() === "bucuresti"
    ? "Livrare estimată: 1–2 zile lucrătoare de la confirmarea comenzii."
    : "Livrare estimată: aproximativ 3 zile lucrătoare de la confirmarea comenzii.";
}

export function recentPurchasedProductIds(
  orders: Array<{ status: string; order_items?: Array<{ product_id: string | null }> | null }>,
  limit = 5,
): string[] {
  const ids = new Set<string>();
  for (const order of orders) {
    if (!["confirmat", "in_livrare", "finalizat"].includes(order.status)) continue;
    for (const item of order.order_items ?? []) {
      if (item.product_id) ids.add(item.product_id);
      if (ids.size >= limit) return [...ids];
    }
  }
  return [...ids];
}

export function repeatPurchaseLine(
  product: Product | undefined,
  variantId: string | null,
): { productId: string; variantId: string | null; qty: number } | null {
  if (!product || product.status !== "published" || product.is_archived) return null;
  const variants = product.product_variants ?? [];
  const variant = variantId ? variants.find((item) => item.id === variantId) : null;
  if ((variantId && !variant) || (!variantId && variants.length > 0)) return null;
  const qty = normalizeQty(product, 1);
  const variantsStocked = variants.some((item) => item.stock > 0);
  const stock = variant && variantsStocked ? variant.stock : product.stock;
  if (product.track_stock && stock < qty) return null;
  return { productId: product.id, variantId, qty };
}
