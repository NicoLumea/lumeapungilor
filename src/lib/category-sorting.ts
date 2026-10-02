import type { Product } from "./shop-types.ts";

export type CategoryMembership = {
  product_id: string;
  sort_order?: number | null;
  created_at?: string | null;
};

export type CatalogSort = "default" | "pret-asc" | "pret-desc" | "nume";

function rank(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/** A missing rank never removes a product; it merely puts it after ranked products. */
export function sortCategoryProducts(
  products: Product[],
  memberships: CategoryMembership[],
): Product[] {
  const byProduct = new Map(memberships.map((membership) => [membership.product_id, membership]));
  const uniqueProducts = [...new Map(products.map((product) => [product.id, product])).values()];
  return uniqueProducts.sort((a, b) => {
    const aRank = rank(byProduct.get(a.id)?.sort_order);
    const bRank = rank(byProduct.get(b.id)?.sort_order);
    if (aRank !== null && bRank !== null && aRank !== bRank) return aRank - bRank;
    if (aRank !== null && bRank === null) return -1;
    if (aRank === null && bRank !== null) return 1;
    const aDate = byProduct.get(a.id)?.created_at ?? a.created_at ?? "";
    const bDate = byProduct.get(b.id)?.created_at ?? b.created_at ?? "";
    return aDate.localeCompare(bDate) || a.id.localeCompare(b.id);
  });
}

export function sortCatalogProducts(products: Product[], sort: CatalogSort): Product[] {
  const result = [...products];
  if (sort === "default") return result;
  return result.sort((a, b) => {
    const comparison =
      sort === "pret-asc"
        ? Number(a.price) - Number(b.price)
        : sort === "pret-desc"
          ? Number(b.price) - Number(a.price)
          : a.name.localeCompare(b.name, "ro");
    return comparison || a.id.localeCompare(b.id);
  });
}
