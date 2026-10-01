export const SITEMAP_ORIGIN = "https://lumeapungilor.ro";

// The root route redirects to /magazin, so only its canonical destination belongs here.
export const INDEXABLE_STATIC_PATHS = [
  "/magazin",
  "/produse",
  "/despre",
  "/contact",
  "/livrare",
  "/retur",
  "/confidentialitate",
  "/termeni",
] as const;

export type SitemapRow = {
  slug: string;
  updated_at: string | null;
};

const PUBLIC_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function lastModified(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildSitemap(categories: SitemapRow[], products: SitemapRow[]): string {
  const urls = new Map<string, string | null>();
  for (const path of INDEXABLE_STATIC_PATHS) urls.set(path, null);

  for (const [prefix, rows] of [
    ["/categorie/", categories],
    ["/produs/", products],
  ] as const) {
    for (const row of rows) {
      const slug = row.slug?.trim();
      if (!slug || !PUBLIC_SLUG.test(slug)) continue;
      const path = `${prefix}${slug}`;
      const modified = lastModified(row.updated_at);
      // A duplicate slug never emits a duplicate URL; retain the newest reliable timestamp.
      if (!urls.has(path) || (modified && (!urls.get(path) || modified > urls.get(path)!))) {
        urls.set(path, modified);
      }
    }
  }

  const entries = [...urls].map(([path, modified]) => {
    const loc = `<loc>${escapeXml(`${SITEMAP_ORIGIN}${path}`)}</loc>`;
    return `  <url>${loc}${modified ? `<lastmod>${modified}</lastmod>` : ""}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}
