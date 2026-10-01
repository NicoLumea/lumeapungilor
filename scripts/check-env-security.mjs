import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ignoredPaths = [
  ".env.local",
  ".env.production",
  ".env.development.local",
  "config/.env",
  "config/.env.local",
  ".dev.vars",
];

for (const path of ignoredPaths) {
  const result = spawnSync("git", ["check-ignore", "--no-index", "-q", "--", path], {
    cwd: root,
  });
  if (result.status !== 0) throw new Error(`Git does not ignore ${path}`);
}

const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root })
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
for (const path of tracked) {
  const name = path.split("/").at(-1)?.toLowerCase() ?? "";
  // Root .env is platform-managed and contains only publishable values.
  if (path === ".env") continue;
  if ((name === ".env" || name.startsWith(".env.")) && name !== ".env.example") {
    throw new Error(`Tracked environment file: ${path}`);
  }
}

const browserRoot = [".output/public", "dist/client", "dist", ".output/client"]
  .map((path) => join(root, path))
  .find(existsSync);
if (!browserRoot) throw new Error("No browser build found. Run the production build first.");

const privateNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "LOVABLE_CRON_SECRET",
  "LOGIN_RATE_LIMIT_PEPPER",
  "OWNER_SETUP_CODE",
];
const canary = process.env.ENV_SECURITY_CANARY;
const textExtensions = new Set([".js", ".html", ".css", ".json", ".map"]);

function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) {
      inspect(file);
      continue;
    }
    const name = entry.name.toLowerCase();
    const display = relative(root, file).split(sep).join("/");
    if (name === ".env" || name.startsWith(".env.") || name.startsWith(".dev.vars")) {
      throw new Error(`Environment file in browser build: ${display}`);
    }
    if (!textExtensions.has(extname(name))) continue;
    const content = readFileSync(file, "utf8");
    for (const key of privateNames) {
      if (content.includes(key)) throw new Error(`Private variable name in browser build: ${key}`);
    }
    if (canary && content.includes(canary)) {
      throw new Error(`Private-value canary in browser build: ${display}`);
    }
  }
}

inspect(browserRoot);
console.log("Environment ignore rules and browser build exposure checks passed.");
