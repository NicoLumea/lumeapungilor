import assert from "node:assert/strict";
import test from "node:test";
import { isSensitivePath } from "./sensitive-paths.ts";

test("blocks direct and nested environment file paths", () => {
  for (const path of [
    "/.env",
    "/.env.local",
    "/.env.production",
    "/.env.development.local",
    "/config/.env",
    "/config/.env.local",
    "/%2eenv",
    "/config/%252eenv.production",
    "/config\\.env",
    "/.dev.vars",
    "/.git/config",
    "/certificates/private.pem",
  ]) {
    assert.equal(isSensitivePath(path), true, path);
  }
});

test("allows normal storefront and well-known URLs", () => {
  for (const path of ["/", "/magazin", "/configurator", "/.well-known/security.txt"]) {
    assert.equal(isSensitivePath(path), false, path);
  }
});
