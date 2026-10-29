import { describe, expect, it } from "vitest";
import { legacyHostRedirect } from "./legacy-host-redirect.ts";

const loc = (url: string, method = "GET") =>
  legacyHostRedirect(new Request(url, { method }))?.headers.get("Location") ?? null;
const H = "https://lumeapungilor.lovable.app";

describe("legacy host redirect", () => {
  it("maps legacy paths in one hop", () => {
    expect(loc(`${H}/magazin`)).toBe("https://lumeapungilor.ro/");
    expect(loc(`${H}/magazin/`)).toBe("https://lumeapungilor.ro/");
    expect(loc(`${H}/contacteaza-ne/`)).toBe("https://lumeapungilor.ro/contact");
    expect(loc(`${H}/contact-us`)).toBe("https://lumeapungilor.ro/contact");
    expect(loc(`${H}/contacte/`)).toBe("https://lumeapungilor.ro/contact");
    expect(loc(`${H}/despre-noi`)).toBe("https://lumeapungilor.ro/despre");
  });
  it("preserves path and query", () => {
    expect(loc(`${H}/produs/x?a=1&b=2`)).toBe("https://lumeapungilor.ro/produs/x?a=1&b=2");
    expect(loc(`${H}/magazin?q=pungi`)).toBe("https://lumeapungilor.ro/?q=pungi");
    expect(loc(`${H}/`, "HEAD")).toBe("https://lumeapungilor.ro/");
    expect(legacyHostRedirect(new Request(`${H}/`))?.status).toBe(301);
  });
  it("never leaves the production origin", () => {
    expect(loc(`${H}//evil.com/x`)).toBe("https://lumeapungilor.ro/evil.com/x");
  });
  it("skips other hosts and non-GET methods", () => {
    expect(loc("https://lumeapungilor.ro/magazin")).toBeNull();
    expect(loc("https://id-preview--abc.lovable.app/magazin")).toBeNull();
    expect(loc("https://x.lumeapungilor.lovable.app/")).toBeNull();
    expect(loc("http://localhost:8080/magazin")).toBeNull();
    expect(loc(`${H}/api/x`, "POST")).toBeNull();
  });
});
