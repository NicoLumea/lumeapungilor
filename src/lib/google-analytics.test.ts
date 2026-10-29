import assert from "node:assert/strict";
import { test } from "node:test";
import { COOKIE_CONSENT_KEY, setCookieConsent } from "./cookieConsent.ts";
import { analyticsPageUrl, GA_MEASUREMENT_ID, syncGoogleAnalytics } from "./google-analytics.ts";

test("only public production routes are measurable, without query strings or fragments", () => {
  for (const path of ["/", "/produse", "/produs/punga", "/categorie/ambalaje", "/contact"]) {
    assert.equal(
      analyticsPageUrl("https://lumeapungilor.ro", path),
      `https://lumeapungilor.ro${path}`,
    );
  }
  for (const path of [
    "/magazin",
    "/cont",
    "/checkout",
    "/cos",
    "/comanda/123",
    "/staff",
    "/staff/comenzi",
    "/n7q4-v2m9",
    "/autentificare",
    "/parola-noua",
    "/retururi",
    "/feedback",
    "/ajutor-comanda",
    "/produs/a?email=private",
    "/produs/a#token",
  ]) {
    assert.equal(analyticsPageUrl("https://lumeapungilor.ro", path), null, path);
  }
  for (const origin of [
    "http://localhost:3000",
    "https://preview.workers.dev",
    "https://lumeapungilor.ro.evil.test",
    "https://lovable.app",
  ]) {
    assert.equal(analyticsPageUrl(origin, "/"), null, origin);
  }
});

test("analytics respects consent, deduplicates page views, excludes private pages and supports withdrawal", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const values = new Map<string, string>();
  const appended: unknown[] = [];
  const deletedCookies: string[] = [];
  const browser = Object.assign(new EventTarget(), {
    location: { origin: "https://lumeapungilor.ro" },
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
    dataLayer: [] as unknown[],
  });
  const documentMock = {
    title: "Magazin — Lumea Pungilor",
    referrer: "https://www.google.com/search?q=private-query",
    getElementById: () => appended[0] ?? null,
    createElement: () => ({}),
    head: { appendChild: (element: unknown) => appended.push(element) },
    get cookie() {
      return "_ga=123; _ga_5C1GD5RB5W=456; session=keep";
    },
    set cookie(value: string) {
      deletedCookies.push(value);
    },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "document", { configurable: true, value: documentMock });
  const commands = () => browser.dataLayer.map((entry) => Array.from(entry as ArrayLike<unknown>));
  const views = () => commands().filter((entry) => entry[0] === "event");
  try {
    syncGoogleAnalytics("/");
    assert.equal(appended.length, 0);
    assert.equal(browser.dataLayer.length, 0);
    setCookieConsent({ analytics: false });
    syncGoogleAnalytics("/");
    assert.equal(appended.length, 0);

    setCookieConsent({ analytics: true });
    browser.location.origin = "https://preview.workers.dev";
    syncGoogleAnalytics("/");
    assert.equal(appended.length, 0);
    browser.location.origin = "https://lumeapungilor.ro";
    syncGoogleAnalytics("/cont");
    assert.equal(appended.length, 0);

    syncGoogleAnalytics("/");
    syncGoogleAnalytics("/");
    assert.equal(appended.length, 1);
    assert.equal(views().length, 1);
    assert.deepEqual(commands()[0], [
      "consent",
      "default",
      {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    ]);
    const config = commands().find((entry) => entry[0] === "config");
    assert.equal((config?.[2] as Record<string, unknown>)["send_page_view"], false);
    assert.deepEqual(views()[0]?.[2], {
      send_to: GA_MEASUREMENT_ID,
      page_location: "https://lumeapungilor.ro/",
      page_title: documentMock.title,
      page_referrer: "https://www.google.com",
    });

    syncGoogleAnalytics("/produs/punga");
    assert.equal(views().length, 2);
    const latestConfig = commands()
      .filter((entry) => entry[0] === "config")
      .at(-1);
    assert.equal(
      (latestConfig?.[2] as Record<string, unknown>)["page_location"],
      "https://lumeapungilor.ro/produs/punga",
    );
    syncGoogleAnalytics("/checkout");
    assert.equal(views().length, 2);
    assert.equal(
      (browser as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`],
      true,
    );
    syncGoogleAnalytics("/");
    assert.equal(views().length, 3);

    setCookieConsent({ analytics: false });
    syncGoogleAnalytics("/");
    assert.equal(views().length, 3);
    assert.ok(deletedCookies.some((cookie) => cookie.startsWith("_ga=")));
    assert.ok(deletedCookies.every((cookie) => !cookie.startsWith("session=")));
    assert.equal(
      (browser as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`],
      true,
    );

    setCookieConsent({ analytics: true });
    syncGoogleAnalytics("/");
    assert.equal(views().length, 4);
    assert.equal(appended.length, 1);
    values.set(COOKIE_CONSENT_KEY, "invalid");
    syncGoogleAnalytics("/contact");
    assert.equal(views().length, 4);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
});
