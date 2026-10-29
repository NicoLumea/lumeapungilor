/** Old Lovable-hosted shop; production now lives on the .ro domain. */
export const LEGACY_HOST = "lumeapungilor.lovable.app";
export const PRODUCTION_ORIGIN = "https://lumeapungilor.ro";

const PATH_MAP: Record<string, string> = {
  "/magazin": "/",
  "/contacteaza-ne": "/contact",
  "/contact-us": "/contact",
  "/contacte": "/contact",
  "/despre-noi": "/despre",
};

/** Returns a 301 to production for GET/HEAD on the exact legacy host, else null. */
export function legacyHostRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  if (url.hostname.toLowerCase() !== LEGACY_HOST) return null;

  const trimmed = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  const path = PATH_MAP[trimmed] ?? url.pathname;
  // Always same fixed origin; path starts with "/" so no host injection ("//evil" collapsed).
  const safePath = "/" + path.replace(/^\/+/, "");
  const location = `${PRODUCTION_ORIGIN}${safePath}${url.search}`;
  return new Response(null, {
    status: 301,
    headers: { Location: location, "Cache-Control": "public, max-age=3600" },
  });
}
