import assert from "node:assert/strict";

const base = (process.argv[2] || process.env.CRAWL_BASE_URL || "").replace(/\/$/, "");
if (!base) throw new Error("Usage: node scripts/crawl-public-html.mjs https://preview.example");

async function html(path) {
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  return response.text();
}

const sitemapResponse = await fetch(`${base}/sitemap.xml`);
assert.equal(sitemapResponse.status, 200, "sitemap.xml must be public");
const sitemap = await sitemapResponse.text();
const robotsResponse = await fetch(`${base}/robots.txt`);
assert.equal(robotsResponse.status, 200, "robots.txt must be public");
const robots = await robotsResponse.text();
assert.match(robots, /Allow: \/(?:\r?\n|$)/, "public routes must be crawlable");
assert.match(robots, /Sitemap: https?:\/\//, "robots.txt must reference the sitemap");
assert.doesNotMatch(robots, /Disallow: \/produs(?:\r?\n|$)/);
assert.doesNotMatch(robots, /Disallow: \/categorie(?:\r?\n|$)/);
const paths = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);
const productPaths = paths.filter((path) => path.startsWith("/produs/"));
const categoryPaths = paths.filter((path) => path.startsWith("/categorie/"));
assert.ok(productPaths.length > 0, "sitemap must contain products");
assert.ok(categoryPaths.length > 0, "sitemap must contain categories");

const allProducts = await html("/produse");
for (const path of productPaths) {
  assert.match(allProducts, new RegExp(`href=["']${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
}

let categoryLinks = 0;
for (const path of categoryPaths) {
  const body = await html(path);
  assert.match(body, /<h1[^>]*>[^<]+<\/h1>/i, `${path} must expose its real H1`);
  categoryLinks += (body.match(/href=["']\/produs\//g) ?? []).length;
}
assert.ok(categoryLinks > 0, "category HTML must expose product links");

async function inParallel(items, concurrency, visit) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        await visit(items[index]);
      }
    }),
  );
}

let schemaPages = 0;
const canonicals = new Set();
const titles = new Set();
await inParallel(productPaths, 6, async (path) => {
  const body = await html(path);
  assert.match(body, /<h1[^>]*>[^<]+<\/h1>/i, `${path} is missing its product H1`);
  assert.match(body, /<link[^>]+rel=["']canonical["'][^>]*>/i, `${path} is missing canonical`);
  assert.match(body, /<meta[^>]+name=["']description["'][^>]*>/i, `${path} is missing description`);
  assert.match(body, /"@type":"Product"/, `${path} is missing Product JSON-LD`);
  assert.match(body, /<img[^>]+alt=["'][^"']+["']/i, `${path} is missing image alt`);
  const canonical = body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1];
  const title = body.match(/<title>([^<]+)<\/title>/i)?.[1];
  assert.ok(canonical, `${path} has no readable canonical URL`);
  assert.ok(title, `${path} has no readable title`);
  assert.equal(canonicals.has(canonical), false, `${path} has a duplicate canonical URL`);
  assert.equal(titles.has(title), false, `${path} has a duplicate title`);
  canonicals.add(canonical);
  titles.add(title);
  schemaPages += 1;
});

const missing = await fetch(`${base}/produs/acest-produs-nu-exista`, { redirect: "manual" });
assert.equal(missing.status, 404, "unknown product slugs must return HTTP 404");

console.log(
  JSON.stringify({
    productUrls: productPaths.length,
    categoryUrls: categoryPaths.length,
    productPagesChecked: schemaPages,
    productPagesWithSchema: schemaPages,
    categoryProductLinksFound: categoryLinks,
    emptyShellPages: 0,
    brokenProductLinks: 0,
    duplicateCanonicalUrls: 0,
  }),
);
