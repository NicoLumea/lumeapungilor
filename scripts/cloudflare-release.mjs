import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

process.chdir(resolve(import.meta.dirname, ".."));
const action = process.argv[2];
const commands = {
  preview: { target: "preview", args: ["preview"] },
  upload: { target: "production", args: ["versions", "upload"] },
  "dry-run": { args: ["deploy", "--dry-run"] },
};
const command = commands[action];
if (!command)
  throw new Error(
    "Use preview, upload, or dry-run. Production publication is manual in Cloudflare.",
  );
const build = JSON.parse(readFileSync(".output/cloudflare-build.json", "utf8"));
const config = JSON.parse(readFileSync(".output/server/wrangler.json", "utf8"));
if (command.target && build.target !== command.target)
  throw new Error("Wrong build target. Rebuild for the requested environment.");
if (build.configHash !== createHash("sha256").update(JSON.stringify(config)).digest("hex")) {
  throw new Error("Cloudflare configuration changed after build. Rebuild before uploading.");
}
const require = createRequire(import.meta.url);
const cli = resolve(require.resolve("wrangler/package.json"), "..", "bin/wrangler.js");
const result = spawnSync(
  process.execPath,
  [cli, ...command.args, "--config", ".output/server/wrangler.json"],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
