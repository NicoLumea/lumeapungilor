import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sortCategoryProducts, type CategoryMembership } from "@/lib/category-sorting";
import { PRODUCT_BASE_SELECT, specList, type Category, type Product } from "@/lib/shop-types";
import { categoryRouteSlug } from "@/lib/sitemap";

const PAGE_SIZE = 500;

function publicCatalogClient() {
  const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Public catalog configuration is unavailable");

  // SEO reads use the same anonymous RLS-protected catalogue as the browser. Never use a
  // service-role key here: draft and private records must remain invisible.
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(
          typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
        );
        if (init?.headers) {
          new Headers(init.headers).forEach((value, name) => headers.set(name, value));
        }
        if (key.startsWith("sb_publishable_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalize(row: Record<string, unknown>): Product {
  return { ...(row as unknown as Product), specs: specList(row["specs"]) };
}

async function withCategoryLinks(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;
  const client = publicCatalogClient();
  const links: NonNullable<Product["product_categories"]> = [];
  for (let start = 0; start < products.length; start += 100) {
    const ids = products.slice(start, start + 100).map((product) => product.id);
    const { data, error } = await client
      .from("product_categories")
      .select("product_id,category_id,categories!product_categories_category_id_fkey(id,slug,name)")
      .in("product_id", ids);
    if (error) throw error;
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

export async function fetchSeoCategories(): Promise<Category[]> {
  const client = publicCatalogClient();
  const categories: Category[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await client
      .from("categories")
      .select("id,slug,name,description,image_url,sort_order,is_visible")
      .eq("is_visible", true)
      .order("sort_order")
      .order("id")
      .range(start, start + PAGE_SIZE - 1);
    if (error) throw error;
    categories.push(...((data ?? []) as Category[]));
    if ((data ?? []).length < PAGE_SIZE) break;
  }
  return categories;
}

/** Mirrors fetchPublishedProducts without replacing the browser/runtime hook. */
export async function fetchSeoPublishedProducts(): Promise<Product[]> {
  const client = publicCatalogClient();
  const products: Product[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await client
      .from("products")
      .select(PRODUCT_BASE_SELECT)
      .eq("status", "published")
      .eq("is_archived", false)
      .order("sort_order")
      .order("created_at", { ascending: false })
      .order("id")
      .range(start, start + PAGE_SIZE - 1);
    if (error) throw error;
    products.push(
      ...(data ?? []).map((row) => normalize(row as unknown as Record<string, unknown>)),
    );
    if ((data ?? []).length < PAGE_SIZE) break;
  }
  return withCategoryLinks(products);
}

async function fetchSeoCategoryMemberships(categoryId: string): Promise<CategoryMembership[]> {
  const client = publicCatalogClient();
  const memberships: CategoryMembership[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const ranked = await client
      .from("product_categories")
      .select("product_id,sort_order,created_at")
      .eq("category_id", categoryId)
      .order("created_at")
      .order("product_id")
      .range(start, start + PAGE_SIZE - 1);
    if (ranked.error) {
      if (ranked.error.code !== "42703" || !ranked.error.message.includes("sort_order")) {
        throw ranked.error;
      }
      break;
    }
    memberships.push(...(ranked.data ?? []));
    if ((ranked.data ?? []).length < PAGE_SIZE) return memberships;
  }

  const legacyMemberships: CategoryMembership[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const legacy = await client
      .from("product_categories")
      .select("product_id,created_at")
      .eq("category_id", categoryId)
      .order("created_at")
      .order("product_id")
      .range(start, start + PAGE_SIZE - 1);
    if (legacy.error) throw legacy.error;
    legacyMemberships.push(...(legacy.data ?? []));
    if ((legacy.data ?? []).length < PAGE_SIZE) break;
  }
  return legacyMemberships;
}

/** Uses the same ID relationship, legacy fallback and sorter as fetchCategoryProducts. */
export async function fetchSeoCategoryProducts(categoryId: string): Promise<Product[]> {
  const client = publicCatalogClient();
  const memberships = await fetchSeoCategoryMemberships(categoryId);
  const ids = [...new Set(memberships.map((membership) => membership.product_id))];
  const products: Product[] = [];
  for (let start = 0; start < ids.length; start += 100) {
    const { data, error } = await client
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

  // Preserve the existing compatibility path for primary assignments that predate the join row.
  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await client
      .from("products")
      .select(PRODUCT_BASE_SELECT)
      .eq("category_id", categoryId)
      .eq("status", "published")
      .eq("is_archived", false)
      .order("id")
      .range(start, start + PAGE_SIZE - 1);
    if (error) throw error;
    products.push(
      ...(data ?? []).map((row) => normalize(row as unknown as Record<string, unknown>)),
    );
    if ((data ?? []).length < PAGE_SIZE) break;
  }
  return sortCategoryProducts(products, memberships);
}

export async function fetchSeoCategory(slug: string): Promise<{
  category: Category;
  categories: Category[];
  products: Product[];
} | null> {
  const categories = await fetchSeoCategories();
  const category = categories.find((item) => categoryRouteSlug(item.slug) === slug);
  if (!category) return null;
  return { category, categories, products: await fetchSeoCategoryProducts(category.id) };
}

export async function fetchSeoProduct(slug: string): Promise<Product | null> {
  const client = publicCatalogClient();
  const { data, error } = await client
    .from("products")
    .select(PRODUCT_BASE_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_archived", false)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [product] = await withCategoryLinks([
    normalize(data as unknown as Record<string, unknown>),
  ]);
  return product ?? null;
}

export async function fetchSeoCatalog() {
  const [categories, products] = await Promise.all([
    fetchSeoCategories(),
    fetchSeoPublishedProducts(),
  ]);
  return { categories, products };
}
