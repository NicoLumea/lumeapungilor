import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBuildConfig } from "./cloudflare-config.mjs";
import { createCloudflareHandler } from "../cloudflare/runtime.mjs";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const live = "https://live.supabase.co";
const env = {
  PRODUCTION_SUPABASE_URL: live,
  PRODUCTION_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  PRODUCTION_SUPABASE_PROJECT_ID: "live",
  PRODUCTION_SITE_URL: "https://lumeapungilor.ro",
  PREVIEW_SUPABASE_URL: "https://test.supabase.co",
  PREVIEW_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  PREVIEW_SUPABASE_PROJECT_ID: "test",
  PREVIEW_SITE_URL: "https://preview.example.com",
};
const preview = () => resolveBuildConfig(env, live, "preview");
test("builds require an explicit target and public settings; tracked live values are not a fallback", () => {
  assert.throws(() => resolveBuildConfig(env, live), /Choose/);
  assert.throws(() => resolveBuildConfig({}, live, "preview"), /Set PREVIEW/);
  assert.equal(
    resolveBuildConfig({ ...env, WORKERS_CI_BRANCH: "main" }, live).target,
    "production",
  );
  assert.equal(
    resolveBuildConfig({ ...env, WORKERS_CI_BRANCH: "feature/test" }, live).target,
    "preview",
  );
  assert.throws(
    () => resolveBuildConfig({ ...env, WORKERS_CI_BRANCH: "feature/test" }, live, "production"),
    /branch/,
  );
});
test("preview rejects both existing and future production databases", () => {
  for (const url of [live, "https://new-live.supabase.co"]) {
    assert.throws(
      () =>
        resolveBuildConfig(
          {
            ...env,
            PRODUCTION_SUPABASE_URL: "https://new-live.supabase.co",
            PREVIEW_SUPABASE_URL: url,
          },
          live,
          "preview",
        ),
      /separate/,
    );
  }
});
test("private keys cannot be configured as browser keys", () => {
  for (const key of [
    "sb_secret_private",
    `e30.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.sig`,
  ]) {
    assert.throws(
      () => resolveBuildConfig({ ...env, PREVIEW_SUPABASE_PUBLISHABLE_KEY: key }, live, "preview"),
      /public publishable/,
    );
  }
});
test("runtime rejects missing credentials or a database different from the browser build before loading the app", async () => {
  let loaded = false;
  const worker = createCloudflareHandler(() => {
    loaded = true;
  }, preview());
  const response = await worker.fetch(
    new Request("https://preview.example.com/admin"),
    {
      DEPLOYMENT_ENVIRONMENT: "preview",
      SUPABASE_URL: live,
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    },
    {},
  );
  assert.equal(response.status, 503);
  assert.equal(loaded, false);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});
test("preview responses and robots are excluded from indexing, production content is preserved", async () => {
  for (const target of ["preview", "production"]) {
    const build = resolveBuildConfig(env, live, target);
    const worker = createCloudflareHandler(
      async () => ({ fetch: () => new Response("page") }),
      build,
    );
    const runtime = {
      DEPLOYMENT_ENVIRONMENT: target,
      SUPABASE_URL: build.supabaseUrl,
      SUPABASE_PUBLISHABLE_KEY: build.publishableKey,
      SUPABASE_SERVICE_ROLE_KEY: "test-private-key-long-enough",
    };
    const response = await worker.fetch(new Request(build.siteOrigin), runtime, {});
    assert.equal(await response.text(), "page");
    assert.equal(
      response.headers.get("X-Robots-Tag"),
      target === "preview" ? "noindex, nofollow" : null,
    );
    const version = await worker.fetch(
      new Request("https://candidate.workers.dev/robots.txt"),
      runtime,
      {},
    );
    assert.equal(await version.text(), "User-agent: *\nDisallow: /\n");
  }
});
test("site images are preserved byte for byte at their existing URLs", () => {
  for (const [name, hash] of [
    [
      "lumea-pungilor-b2b-header-1920x800.png",
      "4fc73e61153aa82c5588281ac4ad8573ab82c11113d9c9943ec860d7225b827d",
    ],
    ["whatsapp-icon.png", "31ada590156234c3f37fea9eaf7185a83d3ad66a1951e9e0edfdcf98e33493a7"],
  ]) {
    const asset = JSON.parse(
      readFileSync(new URL(`../src/assets/${name}.asset.json`, import.meta.url)),
    );
    const bytes = readFileSync(new URL(`../public${asset.url}`, import.meta.url));
    assert.equal(bytes.length, asset.size);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash);
  }
});
