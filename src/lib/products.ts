import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_BASE_SELECT, specList, type Product } from "@/lib/shop-types";
import { sortCategoryProducts, type CategoryMembership } from "@/lib/category-sorting";

function normalize(row: Record<string, unknown>): Product {
  return { ...(row as unknown as Product), specs: specList(row["specs"]) };
}

async function withCategoryLinks(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;
  const links: NonNullable<Product["product_categories"]> = [];
  for (let start = 0; start < products.length; start += 100) {
    const ids = products.slice(start, start + 100).map((product) => product.id);
    const { data, error } = await supabase
      .from("product_categories")
      .select("product_id,category_id,categories!product_categories_category_id_fkey(id,slug,name)")
      .in("product_id", ids);
    if (error) {
      // Base catalog remains usable if a deployment has not applied this optional relation yet.
      console.error("Product category relationships could not be loaded", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return products;
    }
    links.push(...(data ?? []));
  }
  const byProduct = new Map<string, typeof links>();
  for (const link of links) {
    const current = byProduct.get(link.product_id) ?? [];
    current.push(link);
    byProduct.set(link.product_id, current);
  }
  return products.map((product) => ({
    ...product,
    product_categories: byProduct.get(product.id) ?? [],
  }));
}

export async function fetchPublishedProducts(): Promise<Product[]> {
  const products: Product[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_BASE_SELECT)
      .eq("status", "published")
      .eq("is_archived", false)
      .order("sort_order")
      .order("created_at", { ascending: false })
      .order("id")
      .range(start, start + 499);
    if (error) throw error;
    products.push(
      ...(data ?? []).map((row) => normalize(row as unknown as Record<string, unknown>)),
    );
    if ((data ?? []).length < 500) break;
  }
  return withCategoryLinks(products);
}

export function usePublishedProducts(enabled = true) {
  return useQuery({
    queryKey: ["products", "published"],
    queryFn: fetchPublishedProducts,
    enabled,
  });
}

export type CategoryProductsResult = {
  products: Product[];
  memberships: CategoryMembership[];
  orderingAvailable: boolean;
};

/** The category relationship is required here, but never for the All Products query. */
export async function fetchCategoryMemberships(categoryId: string): Promise<{
  memberships: CategoryMembership[];
  orderingAvailable: boolean;
}> {
  const memberships: CategoryMembership[] = [];
  for (let start = 0; ; start += 500) {
    const ranked = await supabase
      .from("product_categories")
      .select("product_id,sort_order,created_at")
      .eq("category_id", categoryId)
      .order("created_at")
      .order("product_id")
      .range(start, start + 499);
    if (ranked.error) {
      // A frontend-first deployment must keep browsing safe until the migration lands.
      if (ranked.error.code !== "42703" || !ranked.error.message.includes("sort_order")) {
        throw ranked.error;
      }
      break;
    }
    memberships.push(...(ranked.data ?? []));
    if ((ranked.data ?? []).length < 500) {
      return { memberships, orderingAvailable: true };
    }
  }
  const legacyMemberships: CategoryMembership[] = [];
  for (let start = 0; ; start += 500) {
    const legacy = await supabase
      .from("product_categories")
      .select("product_id,created_at")
      .eq("category_id", categoryId)
      .order("created_at")
      .order("product_id")
      .range(start, start + 499);
    if (legacy.error) throw legacy.error;
    legacyMemberships.push(...(legacy.data ?? []));
    if ((legacy.data ?? []).length < 500) break;
  }
  return { memberships: legacyMemberships, orderingAvailable: false };
}

export async function fetchCategoryProducts(categoryId: string): Promise<CategoryProductsResult> {
  const { memberships, orderingAvailable } = await fetchCategoryMemberships(categoryId);
  const products: Product[] = [];
  const ids = [...new Set(memberships.map((membership) => membership.product_id))];
  for (let start = 0; start < ids.length; start += 100) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_BASE_SELECT)
      .in("id", ids.slice(start, start + 100))
      .eq("status", "published")
      .eq("is_archived", false);
    if (error) throw error;
    products.push(
      ...(data ?? []).map((row) => normalize(row as unknown as Record<string, unknown>)),
    );
  }
  // Legacy primary assignments without a relationship must still show in this category.
  for (let start = 0; ; start += 500) {
    const { data: legacy, error: legacyError } = await supabase
      .from("products")
      .select(PRODUCT_BASE_SELECT)
      .eq("category_id", categoryId)
      .eq("status", "published")
      .eq("is_archived", false)
      .order("id")
      .range(start, start + 499);
    if (legacyError) throw legacyError;
    products.push(
      ...(legacy ?? []).map((row) => normalize(row as unknown as Record<string, unknown>)),
    );
    if ((legacy ?? []).length < 500) break;
  }
  return { products: sortCategoryProducts(products, memberships), memberships, orderingAvailable };
}

export function useCategoryProducts(categoryId: string | undefined) {
  return useQuery({
    queryKey: ["products", "category", categoryId],
    enabled: !!categoryId,
    queryFn: () => fetchCategoryProducts(categoryId!),
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_BASE_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const products = await withCategoryLinks([
        normalize(data as unknown as Record<string, unknown>),
      ]);
      return products[0] ?? null;
    },
  });
}

export function useProductsByIds(ids: string[]) {
  return useQuery({
    queryKey: ["products", "byIds", [...ids].sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_BASE_SELECT)
        .in("id", ids);
      if (error) throw error;
      return withCategoryLinks(
        (data ?? []).map((d) => normalize(d as unknown as Record<string, unknown>)),
      );
    },
  });
}
