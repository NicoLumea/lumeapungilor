import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SitemapRow } from "@/lib/sitemap";

const PAGE_SIZE = 1000;

function publicCatalogClient() {
  const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Public catalog configuration is unavailable");

  // This is an isolated anonymous client: no user session and no service-role key.
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(
          typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
        );
        if (init?.headers) {
          new Headers(init.headers).forEach((value, name) => headers.set(name, value));
        }
        // Opaque publishable keys are API keys, not bearer JWTs.
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

export async function fetchSitemapCatalog(): Promise<{
  categories: SitemapRow[];
  products: SitemapRow[];
}> {
  const client = publicCatalogClient();
  const categories: SitemapRow[] = [];
  const products: SitemapRow[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from("categories")
      .select("slug,updated_at")
      .eq("is_visible", true)
      .order("slug")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    categories.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from("products")
      .select("slug,updated_at")
      .eq("status", "published")
      .eq("is_archived", false)
      .order("slug")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    products.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return { categories, products };
}
