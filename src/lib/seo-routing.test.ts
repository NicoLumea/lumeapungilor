import assert from "node:assert/strict";
import { test } from "node:test";
import { publicRedirect, PRODUCTION_ORIGIN } from "./seo-routing.ts";
import { buildSitemap } from "./sitemap.ts";

test("aliases and the old homepage permanently redirect in one hop, preserving queries", () => {
  for (const [source, target] of [
    ["/magazin", "/"],
    ["/contacteaza-ne", "/contact"],
    ["/contact-us", "/contact"],
    ["/contacte", "/contact"],
    ["/despre-noi", "/despre"],
  ]) {
    for (const method of ["GET", "HEAD"]) {
      for (const suffix of ["", "/"]) {
        const result = publicRedirect(
          new Request(`${PRODUCTION_ORIGIN}${source}${suffix}?utm_source=test`, { method }),
        );
        assert.equal(result?.status, 301);
        assert.equal(
          result.headers.get("Location"),
          `${PRODUCTION_ORIGIN}${target}?utm_source=test`,
        );
        assert.equal(publicRedirect(new Request(result.headers.get("Location")!)), null);
      }
    }
  }
});

test("published Lovable domain redirects paths to production, including mapped paths", () => {
  for (const [source, target] of [
    ["/", "/"],
    ["/magazin", "/"],
    ["/contact-us", "/contact"],
    ["/produs/punga", "/produs/punga"],
    ["/categorie/pungi", "/categorie/pungi"],
  ]) {
    const result = publicRedirect(
      new Request(`https://lumeapungilor.lovable.app${source}?utm_source=legacy`),
    );
    assert.equal(result?.status, 301);
    assert.equal(result.headers.get("Location"), `${PRODUCTION_ORIGIN}${target}?utm_source=legacy`);
  }
  const oddPath = publicRedirect(
    new Request("https://lumeapungilor.lovable.app//other.example/path"),
  );
  assert.equal(new URL(oddPath!.headers.get("Location")!).origin, PRODUCTION_ORIGIN);
});

test("editor previews remain usable and POST requests are never replayed to another domain", () => {
  for (const origin of [
    "http://localhost:5173",
    "https://id-preview--project.lovable.app",
    "https://preview--project.lovable.app",
    "https://preview.workers.dev",
  ]) {
    assert.equal(publicRedirect(new Request(`${origin}/`)), null);
    assert.equal(publicRedirect(new Request(`${origin}/produs/punga`)), null);
    assert.equal(
      publicRedirect(new Request(`${origin}/magazin`))?.headers.get("Location"),
      `${origin}/`,
    );
  }
  for (const origin of [PRODUCTION_ORIGIN, "https://lumeapungilor.lovable.app"]) {
    assert.equal(publicRedirect(new Request(`${origin}/magazin`, { method: "POST" })), null);
  }
  for (const path of ["/", "/contact", "/despre", "/magaziner", "/contact-us/extra", "/unknown"]) {
    assert.equal(publicRedirect(new Request(`${PRODUCTION_ORIGIN}${path}`)), null);
  }
});

test("sitemap names the root homepage and production domain without redirect URLs", () => {
  const sitemap = buildSitemap(
    [{ slug: "pungi", updated_at: null }],
    [{ slug: "punga", updated_at: null }],
  );
  assert.match(sitemap, /<loc>https:\/\/lumeapungilor\.ro\/<\/loc>/);
  assert.doesNotMatch(sitemap, /lovable\.app|\/magazin|contact-us|despre-noi/);
});
