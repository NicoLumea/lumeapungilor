export type Spec = { label: string; value: string };

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_visible: boolean;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number | null;
  stock: number;
  sort_order: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  sku: string | null;
  price: number;
  currency: string;
  selling_unit: string;
  units_per_pack: number | null;
  min_order_qty: number;
  qty_increment: number;
  stock: number;
  track_stock: boolean;
  variant_stock_tracked?: boolean;
  status: string;
  is_featured: boolean;
  is_archived: boolean;
  sort_order: number;
  specs: Spec[];
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
  categories?: { id: string; slug: string; name: string } | null;
  product_categories?: {
    category_id: string;
    categories: { id: string; slug: string; name: string } | null;
  }[];
};

export const PRODUCT_SELECT =
  "*, product_images(*), product_variants(*), categories(id,slug,name), product_categories(category_id,categories(id,slug,name))";

/** Nested memberships keep one parent product row, so search and inventory stay unique. */
export function assignedCategories(product: Product): NonNullable<Product["categories"]>[] {
  const linked = (product.product_categories ?? [])
    .map((link) => link.categories)
    .filter((category): category is NonNullable<Product["categories"]> => category !== null);
  if (linked.length > 0) return linked;
  return product.categories ? [product.categories] : [];
}

export function belongsToCategory(product: Product, slug: string): boolean {
  return assignedCategories(product).some((category) => category.slug === slug);
}

export function toggleCategorySelection(
  selected: string[],
  primary: string,
  categoryId: string,
  checked: boolean,
): { categoryIds: string[]; primaryId: string } {
  const categoryIds = checked
    ? [...new Set([...selected, categoryId])]
    : selected.filter((id) => id !== categoryId);
  return {
    categoryIds,
    primaryId: categoryIds.includes(primary) ? primary : (categoryIds[0] ?? ""),
  };
}

export function productAvailableStock(product: Product): number {
  return product.variant_stock_tracked
    ? (product.product_variants ?? []).reduce((sum, variant) => sum + variant.stock, 0)
    : product.stock;
}

export function sortedImages(p: Product): ProductImage[] {
  return [...(p.product_images ?? [])].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      a.created_at.localeCompare(b.created_at) ||
      a.id.localeCompare(b.id),
  );
}

export function primaryImage(p: Product): ProductImage | undefined {
  const images = sortedImages(p);
  return images.find((image) => image.is_primary) ?? images[0];
}

export function specList(specs: unknown): Spec[] {
  if (!Array.isArray(specs)) return [];
  return specs.filter(
    (s): s is Spec => !!s && typeof s === "object" && "label" in s && "value" in s,
  );
}

/** Clamp a quantity to the product's minimum and increment rules. */
export function normalizeQty(
  product: Pick<Product, "min_order_qty" | "qty_increment">,
  qty: number,
): number {
  const min = Math.max(1, product.min_order_qty || 1);
  const step = Math.max(1, product.qty_increment || 1);
  if (!Number.isFinite(qty) || qty < min) return min;
  const steps = Math.round((qty - min) / step);
  return min + Math.max(0, steps) * step;
}
