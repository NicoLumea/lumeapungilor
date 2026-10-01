import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_BASE_SELECT, specList, type Product } from "@/lib/shop-types";

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
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_BASE_SELECT)
    .eq("status", "published")
    .eq("is_archived", false)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withCategoryLinks(
    (data ?? []).map((d) => normalize(d as unknown as Record<string, unknown>)),
  );
}

export function usePublishedProducts() {
  return useQuery({ queryKey: ["products", "published"], queryFn: fetchPublishedProducts });
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
