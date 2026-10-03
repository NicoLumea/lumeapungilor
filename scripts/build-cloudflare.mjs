import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { createHash } from "node:crypto";
import { resolveBuildConfig } from "./cloudflare-config.mjs";

const root = resolve(import.meta.dirname, "..");
process.chdir(root);
const tracked = parseEnv(readFileSync(".env", "utf8"));
const requested = process.argv.find((arg) => arg.startsWith("--target="))?.slice(9);
const build = resolveBuildConfig(process.env, tracked.VITE_SUPABASE_URL, requested);
// Public connection settings are deliberately explicit: never silently use the tracked live .env in previews.
const env = {
  ...process.env,
  CLOUDFLARE_BUILD: "1",
  NITRO_PRESET: "cloudflare-module",
  VITE_SUPABASE_URL: build.supabaseUrl,
  VITE_SUPABASE_PUBLISHABLE_KEY: build.publishableKey,
  VITE_SUPABASE_PROJECT_ID: build.projectId,
  VITE_PUBLIC_SITE_URL: build.siteOrigin,
};
// Credentials belong in runtime secrets, not the build environment.
for (const key of Object.keys(env)) {
  if (/SERVICE_ROLE|SUPABASE_SECRET|OWNER_SETUP|LOGIN_RATE_LIMIT_PEPPER|CRON_SECRET/.test(key))
    delete env[key];
}
const result = spawnSync(process.execPath, ["node_modules/vite/bin/vite.js", "build"], {
  env,
  stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status ?? 1);
const vars = {
  DEPLOYMENT_ENVIRONMENT: build.target,
  SUPABASE_URL: build.supabaseUrl,
  SUPABASE_PUBLISHABLE_KEY: build.publishableKey,
  PUBLIC_SITE_URL: build.siteOrigin,
};
const config = JSON.parse(readFileSync("cloudflare/wrangler.base.json", "utf8"));
config.vars = vars;
config.previews = { vars };
copyFileSync("cloudflare/runtime.mjs", ".output/server/cloudflare-runtime.mjs");
writeFileSync(
  ".output/server/cloudflare-entry.mjs",
  [
    'import { createCloudflareHandler } from "./cloudflare-runtime.mjs";',
    `export default createCloudflareHandler(() => import("./index.mjs").then(m => m.default), ${JSON.stringify(build)});`,
    "",
  ].join("\n"),
);
writeFileSync(".output/server/wrangler.json", JSON.stringify(config, null, 2) + "\n");
writeFileSync(
  ".output/cloudflare-build.json",
  JSON.stringify(
    { ...build, configHash: createHash("sha256").update(JSON.stringify(config)).digest("hex") },
    null,
    2,
  ) + "\n",
);
if (build.target === "preview") {
  appendFileSync(".output/public/_headers", "\n/*\n  X-Robots-Tag: noindex, nofollow\n");
}
console.log(`Cloudflare ${build.target} bundle prepared. No upload or deployment has occurred.`);
