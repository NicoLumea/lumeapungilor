import { useMemo } from "react";
import { useCart } from "@/lib/cart";
import { useProductsByIds } from "@/lib/products";
import { num, useContent } from "@/lib/content";
import { fromBani, toBani, vatBani } from "@/lib/money";
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
  const { lines, ready } = useCart();
  const ids = useMemo(() => [...new Set(lines.map((line) => line.productId))], [lines]);
  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useProductsByIds(ids);
  const {
    data: content,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useContent();

  const { resolved, invalidItems } = useMemo(() => {
    const resolved: ResolvedLine[] = [];
    const invalidItems: { productId: string; variantId: string | null; message: string }[] = [];
    if (!products) return { resolved, invalidItems };
    for (const line of lines) {
      const product = products.find((candidate) => candidate.id === line.productId);
      if (!product || product.status !== "published" || product.is_archived) {
        invalidItems.push({
          productId: line.productId,
          variantId: line.variantId,
          message: "Un produs din coș nu mai este disponibil.",
        });
        continue;
      }
      const variants = product.product_variants ?? [];
      const variant = line.variantId
        ? (variants.find((candidate) => candidate.id === line.variantId) ?? null)
        : null;
      if ((line.variantId && !variant) || (!line.variantId && variants.length > 0)) {
        invalidItems.push({
          productId: line.productId,
          variantId: line.variantId,
          message: `Varianta pentru „${product.name}” nu mai este disponibilă.`,
        });
        continue;
      }
      try {
        const unitBani = toBani(variant?.price ?? product.price);
        resolved.push({
          product,
          variant,
          qty: line.qty,
          unitPrice: fromBani(unitBani),
          lineTotal: fromBani(unitBani * line.qty),
          imageUrlPath: sortedImages(product)[0]?.url ?? null,
          stock: variant ? variant.stock : product.stock,
        });
      } catch {
        invalidItems.push({
          productId: line.productId,
          variantId: line.variantId,
          message: `Prețul pentru „${product.name}” nu este disponibil.`,
        });
      }
    }
    return { resolved, invalidItems };
  }, [lines, products]);

  const settings = content?.["settings"];
  const flat = num(settings, "shipping_flat");
  const freeOver = num(settings, "free_shipping_over");
  const vatRate = num(settings, "vat_rate");
  const pricesIncludeVat = settings?.["prices_include_vat"];
  const shippingTaxable = settings?.["shipping_taxable"];
  const configurationReady =
    flat !== null &&
    flat >= 0 &&
    vatRate !== null &&
    vatRate >= 0 &&
    vatRate <= 100 &&
    typeof pricesIncludeVat === "boolean" &&
    typeof shippingTaxable === "boolean";
  const subtotalBani = resolved.reduce((sum, line) => sum + toBani(line.lineTotal), 0);
  const shippingBani = configurationReady
    ? freeOver !== null && subtotalBani >= toBani(freeOver)
      ? 0
      : toBani(flat)
    : 0;
  const taxableBani = subtotalBani + (shippingTaxable === true ? shippingBani : 0);
  const vatAmountBani = configurationReady
    ? pricesIncludeVat
      ? Math.round((taxableBani * vatRate) / (100 + vatRate))
      : vatBani(taxableBani, vatRate)
    : 0;
  const totalBani = subtotalBani + shippingBani + (pricesIncludeVat ? 0 : vatAmountBani);
  const hasStockError = resolved.some((line) => line.product.track_stock && line.qty > line.stock);
  const hasQuantityError = resolved.some((line) => {
    const minimum = Math.max(1, line.product.min_order_qty || 1);
    const increment = Math.max(1, line.product.qty_increment || 1);
    return line.qty < minimum || (line.qty - minimum) % increment !== 0;
  });
  const refresh = async () => {
    await Promise.all([refetchProducts(), refetchSettings()]);
  };

  return {
    lines: resolved,
    invalidItems,
    hasStockError,
    hasQuantityError,
    isLoading: !ready || (ids.length > 0 && productsLoading) || settingsLoading,
    isError: productsError || settingsError,
    subtotal: fromBani(subtotalBani),
    shipping: fromBani(shippingBani),
    shippingConfigured: configurationReady,
    tax: fromBani(vatAmountBani),
    vatRate,
    pricesIncludeVat: pricesIncludeVat === true,
    total: fromBani(totalBani),
    configurationReady,
    paymentsConfigured: false,
    refresh,
  };
}
