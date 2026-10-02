import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const runtime = readFileSync(new URL("./products.ts", import.meta.url), "utf8");
const seo = readFileSync(new URL("./seo-catalog.server.ts", import.meta.url), "utf8");

test("the protected browser fetch path remains present and ID-based", () => {
  assert.match(runtime, /export async function fetchPublishedProducts/);
  assert.match(runtime, /export async function fetchCategoryMemberships\(categoryId/);
  assert.match(runtime, /\.from\("product_categories"\)/);
  assert.match(runtime, /\.eq\("category_id", categoryId\)/);
  assert.match(runtime, /\.in\("id", ids\.slice/);
  assert.match(runtime, /sortCategoryProducts\(products, memberships\)/);
  assert.match(runtime, /export function useProduct\(slug/);
  assert.doesNotMatch(runtime, /seo-catalog|generated.*json/i);
});

test("the read-only SEO adapter mirrors, rather than replaces, catalogue invariants", () => {
  assert.match(seo, /\.eq\("status", "published"\)/);
  assert.match(seo, /\.eq\("is_archived", false\)/);
  assert.match(seo, /\.from\("product_categories"\)/);
  assert.match(seo, /\.eq\("category_id", categoryId\)/);
  assert.match(seo, /\.eq\("category_id", categoryId\)[\s\S]*\.eq\("status", "published"\)/);
  assert.match(seo, /sortCategoryProducts\(products, memberships\)/);
  assert.doesNotMatch(seo, /SUPABASE_SERVICE_ROLE_KEY/);
});
