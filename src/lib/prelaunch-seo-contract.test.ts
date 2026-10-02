import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

test("content field aliases preserve existing production copy", () => {
  assert.match(
    read("src/components/site/StoreHero.tsx"),
    /text\(home, "hero_text"\)[\s\S]*hero_subtitle/,
  );
  assert.match(read("src/routes/magazin.tsx"), /editorial_text[\s\S]*editorial_body/);
  const migration = read("supabase/migrations/20261002180000_prelaunch_content_seo.sql");
  assert.match(migration, /hero_subtitle/);
  assert.match(migration, /editorial_body/);
  assert.doesNotMatch(migration, /drop column/i);
});

test("SEO migration is additive and admin-protected", () => {
  const migration = read("supabase/migrations/20261002180000_prelaunch_content_seo.sql");
  for (const field of ["intro_text", "body_text", "meta_title", "meta_description"]) {
    assert.match(migration, new RegExp(`add column if not exists ${field}`));
  }
  assert.match(migration, /public\.is_admin\(\)/);
  assert.match(migration, /seo_redirects_local_paths/);
  assert.match(migration, /SEO redirect loop rejected/);
});

test("Markdown rendering cannot execute raw HTML or create a second H1", () => {
  const markdown = read("src/lib/safe-markdown.tsx");
  assert.doesNotMatch(markdown, /dangerouslySetInnerHTML/);
  assert.ok(markdown.includes("/^(#{2,3})\\s+"));
  assert.match(markdown, /Markdown H1 is rendered as text/);
  for (const path of [
    "src/components/site/ContentPage.tsx",
    "src/components/site/Catalogue.tsx",
    "src/routes/produs.$slug.tsx",
  ]) {
    assert.match(read(path), /SafeMarkdown/);
  }
});

test("incorrect paper-bag SEO claim is absent from application source", () => {
  const files = readdirSync(join(root, "src", "routes"))
    .filter((name) => name.endsWith(".tsx"))
    .map((name) => read(join("src", "routes", name)))
    .join("\n");
  assert.doesNotMatch(files, /pungi de hârtie/i);
});

test("runtime product fetch service remains protected", () => {
  const runtime = read("src/lib/products.ts");
  assert.match(runtime, /from\("product_categories"\)/);
  assert.match(runtime, /\.eq\("category_id", categoryId\)/);
  assert.match(runtime, /from\("products"\)/);
  assert.match(runtime, /export function useCategoryProducts/);
  assert.doesNotMatch(runtime, /seo-catalog/);
});
