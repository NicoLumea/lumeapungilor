const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const PUBLISHABLE_KEY = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

export const IMAGE_BUCKET = "product-images";

/** Turn a stored storage path into a browser-usable URL. */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!SUPABASE_URL) return null;
  const clean = path.replace(/^\/+/, "");
  return `${SUPABASE_URL}/storage/v1/object/${IMAGE_BUCKET}/${clean}?apikey=${PUBLISHABLE_KEY ?? ""}`;
}
