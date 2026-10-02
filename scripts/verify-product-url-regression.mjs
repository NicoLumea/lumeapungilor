import assert from "node:assert/strict";

// The old URL must remain a single 301 hop to the one canonical product URL.
const changes = [
  ["punga-maci-fara-maner-40x50", "punga-floarea-soarelui-40x50"],
  ["maci-fara-maner-40-50", "punga-maci-40x50-maner-decupat"],
  ["punga-paste-fara-maner-40x50", "punga-paste-40x50-maner-decupat"],
  ["punga-paste-cu-maner-40x50", "punga-paste-40x50-maner-bucla"],
  ["punga-din-polietilena-cu-imprimeu-thank-you-40-50-cm", "punga-thank-you-40x50"],
  ["punga-din-polietilena-cu-imprimeu-leopard-30-40-cm", "punga-leopard-30x40"],
  [
    "punga-din-polietilena-cu-model-traditional-romanesc-25-30-cm",
    "punga-traditional-romanesc-25x30-model-2",
  ],
  ["punga-mini-ykr-15-20-cm", "punga-mini-ykr-15x20"],
  ["punga-lamai", "punga-lamai-36x36"],
  ["punga-oras", "punga-urban-40x50"],
  ["punga-floral-maner-bucla-40x50", "punga-florala-40x50-model-2"],
  ["punga-floral-40x50", "punga-florala-40x50-model-3"],
  ["pungi-curierat-35-55", "punga-curierat-35x55"],
  ["fata-de-masa-model-cu-fructe", "musama-cirese-frunze-1-4x50m"],
  ["fata-de-masa-model-de-flori", "musama-florala-1-4x50m"],
  ["fata-de-masa-model-flori", "musama-flori-de-camp-1-4x50m"],
  ["fata-de-masa-model-fructe", "musama-fructe-1-4x50m"],
  ["musama-model-cirese-1-4-x-50-metri", "musama-cirese-1-4x50m"],
  ["musama-bej-cu-medalioane-florale-1-4-x-50-metri", "musama-bej-medalioane-florale-1-4x50m"],
  ["musama-model-alb-cu-flori-albastre-si-mov", "musama-alba-flori-albastre-mov-1-4x50m"],
];

const endpoint = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!endpoint || !key) throw new Error("Public Supabase environment is required");

async function rows(table, query) {
  const response = await fetch(`${endpoint}/rest/v1/${table}?${query}`, {
    headers: { apikey: key },
  });
  assert.equal(response.status, 200, `${table} returned ${response.status}`);
  return response.json();
}

const [products, redirects] = await Promise.all([
  rows("products", "select=id,slug,name&status=eq.published&limit=1000"),
  rows("seo_redirects", "select=from_path,to_path,entity_id&entity_type=eq.product&limit=1000"),
]);
assert.equal(products.length, 63, "Published product count changed; review this regression check");

const bySlug = new Map(products.map((product) => [product.slug, product]));
assert.equal(bySlug.size, products.length, "Two published products share a slug");
const byRedirect = new Map(redirects.map((entry) => [entry.from_path, entry]));
assert.equal(byRedirect.size, redirects.length, "Two redirects share a source URL");
assert.equal(new Set(changes.map(([, target]) => target)).size, changes.length);

const rolledOut = changes.every(
  ([oldSlug, newSlug]) => !bySlug.has(oldSlug) && bySlug.has(newSlug),
);
const pending = changes.every(([oldSlug, newSlug]) => bySlug.has(oldSlug) && !bySlug.has(newSlug));
assert.ok(
  rolledOut || pending,
  "Product URL cleanup is partially applied or conflicts with current data",
);

if (rolledOut) {
  for (const [oldSlug, newSlug] of changes) {
    const redirect = byRedirect.get(`/produs/${oldSlug}`);
    assert.equal(redirect?.to_path, `/produs/${newSlug}`, `Wrong redirect for ${oldSlug}`);
    assert.equal(redirect?.entity_id, bySlug.get(newSlug)?.id, `Wrong product for ${oldSlug}`);
  }
  assert.equal(
    bySlug.get("punga-lalele-30x40")?.name,
    "Pungi cu imprimeu lalele 30 × 40 cm – mâner cu buclă",
  );
  assert.equal(bySlug.get("punga-curierat-50x65")?.name, "Pungi de curierat 50 × 65 cm");
}

for (const redirect of redirects) {
  assert.ok(
    !bySlug.has(redirect.from_path.slice("/produs/".length)),
    "Live product has a redirect source URL",
  );
  assert.ok(bySlug.has(redirect.to_path.slice("/produs/".length)), "Redirect target is missing");
}

console.log(
  rolledOut
    ? `Verified ${products.length} unique product URLs and ${changes.length} permanent redirect records.`
    : `Verified pre-rollout product URLs; ${changes.length} slug changes are pending.`,
);

