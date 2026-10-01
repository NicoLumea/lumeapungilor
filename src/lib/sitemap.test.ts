import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSitemap, INDEXABLE_STATIC_PATHS } from "./sitemap.ts";

test("sitemap contains canonical static, visible category, and published product URLs", () => {
  const xml = buildSitemap(
    [{ slug: "folie-cu-bule", updated_at: "2026-09-30T12:00:00Z" }],
    [{ slug: "produs-test", updated_at: null }],
  );
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<loc>https:\/\/lumeapungilor\.ro\/categorie\/folie-cu-bule<\/loc>/);
  assert.match(xml, /<loc>https:\/\/lumeapungilor\.ro\/produs\/produs-test<\/loc>/);
  assert.match(xml, /<lastmod>2026-09-30T12:00:00\.000Z<\/lastmod>/);
  assert.equal((xml.match(/<url>/g) ?? []).length, INDEXABLE_STATIC_PATHS.length + 2);
  assert.doesNotMatch(xml, /localhost|lovable\.app|\/admin|\/checkout|\/autentificare/);
});

test("invalid and duplicate slugs never produce unsafe or repeated URLs", () => {
  const xml = buildSitemap(
    [
      { slug: "pungi-plastic", updated_at: "2026-09-28T00:00:00Z" },
      { slug: "pungi-plastic", updated_at: "2026-09-29T00:00:00Z" },
      { slug: "../admin", updated_at: null },
      { slug: "", updated_at: null },
    ],
    [{ slug: "product?tracking=1", updated_at: null }],
  );
  assert.equal((xml.match(/\/categorie\/pungi-plastic<\/loc>/g) ?? []).length, 1);
  assert.match(xml, /<lastmod>2026-09-29T00:00:00\.000Z<\/lastmod>/);
  assert.doesNotMatch(xml, /\.\.|tracking|\/admin/);
});
