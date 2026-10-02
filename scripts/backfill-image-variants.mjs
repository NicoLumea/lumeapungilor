import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  IMAGE_VARIANT_WIDTHS,
  IMAGE_VARIANTS_READY_PATH,
  canOptimizeImage,
  imageVariantPath,
  isExistingStorageObject,
} from "../src/lib/image-variants.ts";

const apply = process.argv.includes("--apply");
const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = limitArgument ? Number(limitArgument.slice(8)) : Infinity;
if (!Number.isInteger(limit) && limit !== Infinity) throw new Error("--limit must be an integer");
if (limit <= 0) throw new Error("--limit must be positive");

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = apply
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  throw new Error(
    apply
      ? "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply"
      : "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required for the read-only inventory",
  );
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: (input, init) => {
      const headers = new Headers(
        typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
      );
      new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
      if (
        /^sb_(?:publishable|secret)_/.test(key) &&
        headers.get("Authorization") === `Bearer ${key}`
      ) {
        headers.delete("Authorization");
      }
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    },
  },
});

async function allRows(table, columns) {
  const rows = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .order("id")
      .range(start, start + 499);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < 500) return rows;
  }
}

const [productImages, categories, homeResult] = await Promise.all([
  allRows("product_images", "id,url"),
  allRows("categories", "id,image_url"),
  client.from("site_content").select("value").eq("key", "home").maybeSingle(),
]);
if (homeResult.error) throw homeResult.error;
const homeImages = Object.entries(homeResult.data?.value ?? {})
  .filter(([name, value]) => name.endsWith("image_url") && typeof value === "string")
  .map(([, value]) => value);
const paths = [
  ...new Set(
    [
      ...productImages.map(({ url: path }) => path),
      ...categories.map(({ image_url: path }) => path),
      ...homeImages,
    ]
      .filter((path) => typeof path === "string" && path.length > 0)
      .filter((path) => !/^https?:\/\//i.test(path) && !path.startsWith("/api/public/img/"))
      .filter(canOptimizeImage),
  ),
].slice(0, limit);

if (!apply) {
  console.log(
    `Read-only inventory: ${productImages.length} product image rows, ${categories.length} categories, ${paths.length} distinct eligible originals.`,
  );
  console.log(
    "No objects were downloaded or written. Set SUPABASE_SERVICE_ROLE_KEY and pass --apply to generate variants.",
  );
} else {
  const bucket = client.storage.from("product-images");
  let originalBytes = 0;
  let variantBytes = 0;
  let added = 0;
  let existing = 0;
  let failed = 0;
  for (const path of paths) {
    const { data, error } = await bucket.download(path);
    if (error || !data) {
      console.error(`Cannot download ${path}: ${error?.message ?? "empty object"}`);
      failed++;
      continue;
    }
    const original = Buffer.from(await data.arrayBuffer());
    originalBytes += original.length;
    for (const width of IMAGE_VARIANT_WIDTHS) {
      try {
        const output = await sharp(original)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 90, alphaQuality: 100, effort: 5 })
          .toBuffer();
        const { error: uploadError } = await bucket.upload(imageVariantPath(path, width), output, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });
        if (uploadError) {
          if (isExistingStorageObject(uploadError)) existing++;
          else throw uploadError;
        } else {
          variantBytes += output.length;
          added++;
        }
      } catch (variantError) {
        console.error(`Cannot generate w${width} for ${path}: ${variantError.message}`);
        failed++;
      }
    }
  }
  console.log(
    JSON.stringify({
      originals: paths.length,
      originalBytes,
      newVariantBytes: variantBytes,
      added,
      existing,
      failed,
    }),
  );
  if (!failed && limit === Infinity && paths.length > 0) {
    const marker = Buffer.from(
      JSON.stringify({
        version: 1,
        completedAt: new Date().toISOString(),
        originals: paths.length,
      }),
    );
    const { error: markerError } = await bucket.upload(IMAGE_VARIANTS_READY_PATH, marker, {
      contentType: "application/json",
      cacheControl: "30",
      upsert: false,
    });
    if (markerError && !isExistingStorageObject(markerError)) {
      console.error(`Cannot activate image variants: ${markerError.message}`);
      process.exitCode = 1;
    }
  }
  if (failed) process.exitCode = 1;
}
