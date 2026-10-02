import assert from "node:assert/strict";

const baseline = {
  "/pungi-cadou": [],
  "folie-cu-bule": ["084e8aeb-4e87-42ac-9c8f-4534600ed51f", "f009d311-e9f6-46d9-a02b-b67124ed0635"],
  musama: [
    "30692bb3-b3f2-4f7e-8499-1f317de2fe31",
    "55270d09-ea1d-496a-a718-28f36d885df9",
    "5d52634b-0a5e-419f-b68c-20b765256b3e",
    "5d5af286-50b8-4825-bc1c-a2cae3be9c5c",
    "9bec2440-d648-4314-b27a-bf2a2742bfcb",
    "e3416c44-5743-490a-b154-b1f559f6c052",
    "ed81c639-9bf1-49d5-8942-0b421ae28825",
    "f7e8287e-d256-4945-a885-d44bdb50a8df",
    "f94b6862-87c6-436c-8fbf-4f608456fc12",
  ],
  "pungi-curierat": [
    "126608ee-7697-4e13-8d23-143362b77efa",
    "200f12db-17d7-4f95-ba3c-1a0d520b3512",
    "3a7a1d7c-587d-448b-9f21-272d824a9ee5",
    "50f37d29-0365-4551-8e25-62c06ce13231",
    "6ba3a00b-429a-4d55-a690-df3c388febaf",
    "800f63cd-fd01-4098-93ef-6c6c33057610",
    "86a7f04d-bbea-446e-a61e-ca3be4634545",
    "c16b33cd-ecec-459d-93ad-d2a81d4a6b15",
    "d38323df-da59-4023-8974-a0fecfd7828b",
  ],
  "pungi-mici": [
    "0c9f0e89-4df8-42a1-897d-5f1449a0e365",
    "0dd34762-7064-4f10-b257-c6c00339043b",
    "1100e0aa-03c1-417c-be88-d208710432c5",
    "2067b918-5faa-47e4-bc4d-fc31b8666944",
    "435a7ba2-f0c5-4711-8a9e-e9c7f53abf72",
    "587836de-e830-43c7-bd24-9740d01a671a",
    "599dbf35-e275-4706-9faa-e6a6ae32ca5b",
    "5cb3f8db-8162-4385-a9c3-259fe907d18d",
    "61a56730-ac00-48a4-8280-c1aae80300d3",
    "6c8d9d24-a04f-4352-b325-b46544549fda",
    "71ddc0d9-4cec-47e3-bb80-e067456e9c53",
    "81faefa7-55bb-4b61-8162-89e800b7f6be",
    "845a3586-e162-423d-9316-088c9440de81",
    "9d6c090a-e6ea-4ad9-a594-ffada8a19659",
    "d0543933-e463-45c4-b749-ea8a52b1a690",
    "d1848912-b94e-4e6e-b20f-26894ca359c3",
    "dba80922-fce1-49f9-ae04-8805212bb39d",
    "ec1de721-9763-44a9-968f-c2844d6517ed",
    "ef068a60-ff63-4465-ba83-3e409999088d",
    "f452329e-cb3c-4da1-8a00-464827c84bfb",
    "f87fb017-643d-443a-ba35-4014a195a36c",
  ],
  "pungute-plastic": [
    "066869c2-22b1-423f-b1df-9e72684aa324",
    "22be2229-a904-4b95-9fd9-254aefe57613",
    "29fe7666-0daa-4d55-b3b1-ad2cb8f3878a",
    "39825658-bf41-4a08-abd6-26ff47a50b0d",
    "449e8934-b28c-4037-af48-616a1531712f",
    "50052f43-1016-4e1c-acfa-65bf718b2ef5",
    "559a4d3f-e87b-4400-ae76-30d45466489d",
    "7b670b0a-84d0-41d7-a599-10227c361ed3",
    "7ea4d146-1452-4fcc-bc6e-a1d09acccd5f",
    "9c8ad456-e5b8-43dc-a3d7-86ca8981ae2b",
    "a3224379-1070-4928-b9be-ca79de9010f2",
    "ab45a59b-9912-4a95-9db4-96712650c104",
    "b181690a-cc72-496c-9eeb-957216be516a",
    "e7864789-7a41-4b28-b705-220f9bf80aa7",
    "e7e415e1-2382-4410-a9f8-14da314f7c6e",
    "e808c4a6-5740-4c39-99d8-886d2886bbe3",
    "f09e8b27-74bc-4c48-a3f8-5cbb7622425b",
    "f96f5dde-21c4-4f8e-a2ce-4a1c503b0def",
  ],
};

const endpoint = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!endpoint || !key) throw new Error("Public Supabase environment is required");
const headers = { apikey: key };

async function rows(table, query) {
  const response = await fetch(`${endpoint}/rest/v1/${table}?${query}`, { headers });
  assert.equal(response.status, 200, `${table} returned ${response.status}`);
  return response.json();
}

const [categories, products, links] = await Promise.all([
  rows("categories", "select=id,slug&is_visible=eq.true&order=slug.asc"),
  rows(
    "products",
    "select=id,slug,name,category_id,eco_tax_applicable&status=eq.published&is_archived=eq.false&order=id.asc",
  ),
  rows("product_categories", "select=product_id,category_id"),
]);
const published = new Set(products.map((product) => product.id));
const after = {};
for (const category of categories) {
  after[category.slug] = [
    ...new Set([
      ...links
        .filter((link) => link.category_id === category.id && published.has(link.product_id))
        .map((link) => link.product_id),
      ...products
        .filter((product) => product.category_id === category.id)
        .map((product) => product.id),
    ]),
  ].sort();
}

const giftSlug = categories.find((category) => category.slug.replace(/^\/+/, "") === "pungi-cadou")?.slug;
assert.ok(giftSlug, "Gift-bag category must exist");
const plasticSlug = categories.find((category) => ["pungute-plastic", "pungi-plastic"].includes(category.slug))?.slug;
const smallSlug = categories.find((category) => ["pungi-mici", "pungute-mici"].includes(category.slug))?.slug;
assert.ok(plasticSlug && smallSlug, "Plastic and small-bag categories must exist");

if (after[giftSlug].length === 0) {
  // Historical pre-rollout snapshot: the new content migration has not run yet.
  const historicalBaseline = {
    ...baseline,
    [giftSlug]: baseline["/pungi-cadou"],
    [plasticSlug]: baseline["pungute-plastic"],
    [smallSlug]: baseline["pungi-mici"],
  };
  if (giftSlug !== "/pungi-cadou") delete historicalBaseline["/pungi-cadou"];
  if (plasticSlug !== "pungute-plastic") delete historicalBaseline["pungute-plastic"];
  if (smallSlug !== "pungi-mici") delete historicalBaseline["pungi-mici"];
  assert.deepEqual(after, historicalBaseline);
  console.log(JSON.stringify({ phase: "before-content-rollout", publishedProducts: products.length }));
} else {
  const giftSlugs = new Set([
    "punga-reni-40x50",
    "punga-love-40x50-model-2",
    "punga-oua-paste-25x30",
    "punga-paste-30x40",
    "punga-paste-fara-maner-40x50",
    "punga-paste-cu-maner-40x50",
    "punga-masina-40x50",
    "punga-printesa-40x50",
    "punga-love-40x50",
    "punga-din-polietilena-cu-imprimeu-thank-you-40-50-cm",
    "punga-craciun-mos-craciun",
    "punga-craciun-reni-sanie",
  ]);
  const categoryById = new Map(categories.map((category) => [category.id, category.slug]));
  assert.equal(products.length, 63);
  assert.deepEqual(after["pungi-curierat"], baseline["pungi-curierat"]);
  assert.deepEqual(after["folie-cu-bule"], baseline["folie-cu-bule"]);
  assert.deepEqual(after.musama, baseline.musama);

  let retailCount = 0;
  let smallCount = 0;
  let giftCount = 0;
  for (const product of products) {
    const name = product.name.toLocaleLowerCase("ro");
    const isOther = name.startsWith("folie cu bule") || name.startsWith("mușama");
    const isCourier = name.includes("curierat");
    const isRetail = !isOther && !isCourier;
    const dimensions = [...product.name.matchAll(/(\d+)\s*[×x]\s*(\d+)\s*cm/gi)].flatMap(
      (match) => [Number(match[1]), Number(match[2])],
    );
    const isSmall = isRetail && dimensions.some((dimension) => dimension < 30);
    const isGift = giftSlugs.has(product.slug);
    const assigned = new Set(
      links
        .filter((link) => link.product_id === product.id)
        .map((link) => categoryById.get(link.category_id)),
    );
    if (product.category_id) assigned.add(categoryById.get(product.category_id));

    if (isRetail) {
      retailCount++;
      if (isSmall) smallCount++;
      if (isGift) giftCount++;
      assert.deepEqual(
        [...assigned].sort(),
        [plasticSlug, ...(isSmall ? [smallSlug] : []), ...(isGift ? [giftSlug] : [])].sort(),
        product.slug,
      );
    } else if (isCourier) {
      assert.deepEqual([...assigned], ["pungi-curierat"], product.slug);
    }
    assert.equal(product.eco_tax_applicable, !isOther, product.slug);
  }
  assert.equal(retailCount, 42);
  assert.equal(smallCount, 9);
  assert.equal(giftCount, 12);
  console.log(JSON.stringify({ phase: "after-content-rollout", retailCount, smallCount, giftCount }));
}
