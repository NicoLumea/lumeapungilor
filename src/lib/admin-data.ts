import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildProductSaveInput, type AdminProductDraft } from "@/lib/admin-product";
import { IMAGE_BUCKET } from "@/lib/images";
import { PRODUCT_SELECT, type Product } from "@/lib/shop-types";

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };
  const ext = extensions[file.type];
  if (!ext) throw new Error("Formatul imaginii nu este acceptat.");
  if (file.size < 1 || file.size > 10 * 1024 * 1024) {
    throw new Error("Imaginea trebuie să aibă cel mult 10 MB.");
  }
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

export async function removeUnpersistedProductImages(paths: readonly string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([...new Set(paths)]);
  if (error) throw error;
}

export async function saveProductCatalogEntry(draft: AdminProductDraft): Promise<string> {
  const input = buildProductSaveInput(draft);
  const { data, error } = await supabase.rpc("save_product_catalog_entry", {
    p_product_id: input.productId,
    p_product: input.product,
    p_images: input.images,
    p_variants: input.variants,
  });
  if (error) throw error;
  if (!data) throw new Error("Produsul nu a fost confirmat de baza de date.");
  return data;
}
