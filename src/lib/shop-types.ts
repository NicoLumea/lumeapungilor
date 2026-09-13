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
  status: string;
  is_featured: boolean;
  is_archived: boolean;
  sort_order: number;
  specs: Spec[];
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
  categories?: { slug: string; name: string } | null;
};

export const PRODUCT_SELECT =
  "*, product_images(*), product_variants(*), categories(slug,name)";

export function sortedImages(p: Product): ProductImage[] {
  return [...(p.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
}

export function specList(specs: unknown): Spec[] {
  if (!Array.isArray(specs)) return [];
  return specs.filter(
    (s): s is Spec =>
      !!s && typeof s === "object" && "label" in s && "value" in s,
  );
}

/** Clamp a quantity to the product's minimum and increment rules. */
export function normalizeQty(product: Pick<Product, "min_order_qty" | "qty_increment">, qty: number): number {
  const min = Math.max(1, product.min_order_qty || 1);
  const step = Math.max(1, product.qty_increment || 1);
  if (!Number.isFinite(qty) || qty < min) return min;
  const steps = Math.round((qty - min) / step);
  return min + Math.max(0, steps) * step;
}
