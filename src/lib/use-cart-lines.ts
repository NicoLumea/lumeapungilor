import { useMemo } from "react";
import { useCart } from "@/lib/cart";
import { useProductsByIds } from "@/lib/products";
import { num, useContent } from "@/lib/content";
import { sortedImages, type Product, type ProductVariant } from "@/lib/shop-types";

export type ResolvedLine = {
  product: Product;
  variant: ProductVariant | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  imageUrlPath: string | null;
  stock: number;
};

export function useCartLines() {
  const { lines } = useCart();
  const ids = useMemo(() => [...new Set(lines.map((l) => l.productId))], [lines]);
  const { data: products, isLoading } = useProductsByIds(ids);
  const { data: content } = useContent();

  const resolved = useMemo<ResolvedLine[]>(() => {
    if (!products) return [];
    const out: ResolvedLine[] = [];
    for (const line of lines) {
      const product = products.find((p) => p.id === line.productId);
      if (!product || product.status !== "published" || product.is_archived) continue;
      const variant =
        (product.product_variants ?? []).find((v) => v.id === line.variantId) ?? null;
      const unitPrice = Number(variant?.price ?? product.price);
      out.push({
        product,
        variant,
        qty: line.qty,
        unitPrice,
        lineTotal: Math.round(unitPrice * line.qty * 100) / 100,
        imageUrlPath: sortedImages(product)[0]?.url ?? null,
        stock: variant ? variant.stock : product.stock,
      });
    }
    return out;
  }, [lines, products]);

  const settings = content?.["settings"];
  const subtotal = Math.round(resolved.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
  const flat = num(settings, "shipping_flat");
  const freeOver = num(settings, "free_shipping_over");
  const vatRate = num(settings, "vat_rate");
  const paymentsConfigured = settings?.["payments_configured"] === true;

  const shipping = flat === null ? 0 : freeOver !== null && subtotal >= freeOver ? 0 : flat;
  const tax = vatRate === null ? 0 : Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  return {
    lines: resolved,
    isLoading: isLoading && ids.length > 0,
    subtotal,
    shipping,
    shippingConfigured: flat !== null,
    tax,
    vatRate,
    total,
    paymentsConfigured,
  };
}
