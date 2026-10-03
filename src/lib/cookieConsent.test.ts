import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_PREFERENCES_EVENT,
  getCookieConsent,
  hasAnalyticsConsent,
  hasMarketingConsent,
  NECESSARY_ONLY_CONSENT,
  openCookiePreferences,
  setCookieConsent,
} from "./cookieConsent.ts";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

afterEach(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, "window");
  }
});

function useStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
          values.set(key, value);
        },
      },
    },
  });
  return values;
}

test("server rendering does not access browser storage", () => {
  Reflect.deleteProperty(globalThis, "window");
  assert.equal(getCookieConsent(), null);
  assert.equal(hasAnalyticsConsent(), false);
  assert.deepEqual(setCookieConsent({ analytics: true }), NECESSARY_ONLY_CONSENT);
});

test("footer action broadcasts a preferences-open request", () => {
  const target = new EventTarget();
  let opened = 0;
  target.addEventListener(COOKIE_PREFERENCES_EVENT, () => {
    opened += 1;
  });
  Object.defineProperty(globalThis, "window", { configurable: true, value: target });
  openCookiePreferences();
  assert.equal(opened, 1);
});

test("first visit has no stored preference and no optional consent", () => {
  useStorage();
  assert.equal(getCookieConsent(), null);
  assert.equal(hasAnalyticsConsent(), false);
  assert.equal(hasMarketingConsent(), false);
});

test("necessary-only and all preferences use only the three consent fields", () => {
  const values = useStorage();
  setCookieConsent(NECESSARY_ONLY_CONSENT);
  assert.deepEqual(JSON.parse(values.get(COOKIE_CONSENT_KEY) ?? ""), {
    necessary: true,
    analytics: false,
    marketing: false,
  });

  setCookieConsent({ analytics: true, marketing: true });
  assert.deepEqual(getCookieConsent(), {
    necessary: true,
    analytics: true,
    marketing: true,
  });
  assert.equal(hasAnalyticsConsent(), true);
  assert.equal(hasMarketingConsent(), true);

  setCookieConsent({ analytics: false, marketing: true });
  assert.equal(hasAnalyticsConsent(), false);
  assert.equal(hasMarketingConsent(), true);
});

test("necessary consent cannot be disabled by a stored value", () => {
  const values = useStorage();
  values.set(COOKIE_CONSENT_KEY, '{"necessary":false,"analytics":false,"marketing":false}');
  assert.deepEqual(getCookieConsent(), NECESSARY_ONLY_CONSENT);
});

test("invalid or blocked localStorage never grants optional consent or throws", () => {
  const values = useStorage();
  values.set(COOKIE_CONSENT_KEY, "not json");
  assert.equal(getCookieConsent(), null);

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: Object.defineProperty({}, "localStorage", {
      get: () => {
        throw new Error("blocked");
      },
    }),
  });
  assert.equal(getCookieConsent(), null);
  assert.equal(hasAnalyticsConsent(), false);
  assert.equal(hasMarketingConsent(), false);
  assert.deepEqual(setCookieConsent({ analytics: true, marketing: true }), NECESSARY_ONLY_CONSENT);
});
