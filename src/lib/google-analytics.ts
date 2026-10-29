import { hasAnalyticsConsent } from "./cookieConsent.ts";

export const GA_MEASUREMENT_ID = "G-5C1GD5RB5W";
const DISABLE_KEY = `ga-disable-${GA_MEASUREMENT_ID}` as const;
const SCRIPT_ID = "google-analytics-tag";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [DISABLE_KEY]?: boolean;
};

let configured = false;
let lastPage: string | null = null;

function externalReferrer(): string {
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin === window.location.origin ? "" : referrer.origin;
  } catch {
    return "";
  }
}

// Only public shop pages are measured. Account, order and staff URLs can contain personal data.
export function analyticsPageUrl(origin: string, pathname: string): string | null {
  if (origin !== "https://lumeapungilor.ro" && origin !== "https://www.lumeapungilor.ro") {
    return null;
  }
  const publicPage =
    /^\/(?:magazin|produse|despre|contact|confidentialitate|termeni|retur|livrare|conformitate)?\/?$/.test(
      pathname,
    ) || /^\/(?:produs|categorie)\/[^/?#]+\/?$/.test(pathname);
  return publicPage ? `${origin}${pathname}` : null;
}

function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0];
    if (name !== "_ga" && !name?.startsWith("_ga_")) continue;
    for (const domain of ["", "; Domain=lumeapungilor.ro", "; Domain=www.lumeapungilor.ro"]) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
    }
  }
}

export function syncGoogleAnalytics(pathname: string) {
  if (typeof window === "undefined") return;
  const browser = window as AnalyticsWindow;
  const consent = hasAnalyticsConsent();
  const page = analyticsPageUrl(window.location.origin, pathname);
  const enabled = consent && page !== null;
  browser[DISABLE_KEY] = !enabled;

  if (!enabled) {
    lastPage = null;
    if (configured && !consent) {
      browser.gtag?.("consent", "update", { analytics_storage: "denied" });
      clearAnalyticsCookies();
    }
    return;
  }

  if (!configured) {
    browser.dataLayer ??= [];
    browser.gtag = function () {
      // Google tag consumes the standard gtag arguments-object queue format.
      // eslint-disable-next-line prefer-rest-params
      browser.dataLayer!.push(arguments);
    };
    browser.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    browser.gtag("consent", "update", { analytics_storage: "granted" });
    browser.gtag("js", new Date());
    browser.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: page,
      page_referrer: externalReferrer(),
    });
    configured = true;

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }
  } else {
    browser.gtag?.("consent", "update", { analytics_storage: "granted" });
  }

  if (lastPage === page) return;
  browser.gtag?.("event", "page_view", {
    send_to: GA_MEASUREMENT_ID,
    page_location: page,
    page_title: document.title,
    page_referrer: lastPage ?? externalReferrer(),
  });
  lastPage = page;
}
