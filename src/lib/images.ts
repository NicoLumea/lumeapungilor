export const IMAGE_BUCKET = "product-images";

/**
 * Turn a stored storage path into a browser-usable URL.
 *
 * The storage bucket is private, so images are served through our own
 * same-origin endpoint which reads the object server-side. This keeps URLs
 * permanent (no expiring signed links) and works for anonymous visitors.
 */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/api/public/img/")) return path;
  const clean = path.replace(/^\/+/, "");
  if (!clean) return null;
  return `/api/public/img/${clean.split("/").map(encodeURIComponent).join("/")}`;
}
