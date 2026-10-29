import assert from "node:assert/strict";
import test from "node:test";
import { legacyHostRedirect } from "./legacy-host-redirect.ts";

const loc = (url: string, method = "GET") =>
  legacyHostRedirect(new Request(url, { method }))?.headers.get("Location") ?? null;
const H = "https://lumeapungilor.lovable.app";

test("maps legacy paths in one hop", () => {
  assert.equal(loc(`${H}/magazin`), "https://lumeapungilor.ro/");
  assert.equal(loc(`${H}/magazin/`), "https://lumeapungilor.ro/");
  assert.equal(loc(`${H}/contacteaza-ne/`), "https://lumeapungilor.ro/contact");
  assert.equal(loc(`${H}/contact-us`), "https://lumeapungilor.ro/contact");
  assert.equal(loc(`${H}/contacte/`), "https://lumeapungilor.ro/contact");
  assert.equal(loc(`${H}/despre-noi`), "https://lumeapungilor.ro/despre");
});

test("preserves path and query", () => {
  assert.equal(loc(`${H}/produs/x?a=1&b=2`), "https://lumeapungilor.ro/produs/x?a=1&b=2");
  assert.equal(loc(`${H}/magazin?q=pungi`), "https://lumeapungilor.ro/?q=pungi");
  assert.equal(loc(`${H}/`, "HEAD"), "https://lumeapungilor.ro/");
  assert.equal(legacyHostRedirect(new Request(`${H}/`))?.status, 301);
});

test("never leaves the production origin", () => {
  assert.equal(loc(`${H}//evil.com/x`), "https://lumeapungilor.ro/evil.com/x");
});

test("skips other hosts and non-GET methods", () => {
  assert.equal(loc("https://lumeapungilor.ro/magazin"), null);
  assert.equal(loc("https://id-preview--abc.lovable.app/magazin"), null);
  assert.equal(loc("https://x.lumeapungilor.lovable.app/"), null);
  assert.equal(loc("http://localhost:8080/magazin"), null);
  assert.equal(loc(`${H}/api/x`, "POST"), null);
});
