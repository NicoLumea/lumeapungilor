export const PRODUCTION_ORIGIN = "https://lumeapungilor.ro";
const LEGACY_HOST = "lumeapungilor.lovable.app";

const PERMANENT_PATHS: Readonly<Record<string, string>> = {
  "/magazin": "/",
  "/contacteaza-ne": "/contact",
  "/contact-us": "/contact",
  "/contacte": "/contact",
  "/despre-noi": "/despre",
};

/** Exact legacy host only: editor previews and unrelated Lovable projects stay usable. */
export function publicRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const source = new URL(request.url);
  const legacy = source.hostname === LEGACY_HOST;
  const pathname = source.pathname.replace(/\/$/, "") || "/";
  const mapped = Object.hasOwn(PERMANENT_PATHS, pathname) ? PERMANENT_PATHS[pathname] : undefined;
  if (!legacy && mapped === undefined) return null;

  // Assign pathname separately so a path starting // can never change the destination host.
  const destination = new URL(legacy ? PRODUCTION_ORIGIN : source.origin);
  destination.pathname = mapped ?? source.pathname;
  destination.search = source.search;
  return new Response(null, {
    status: 301,
    headers: { Location: destination.href, "Cache-Control": "public, max-age=300" },
  });
}
