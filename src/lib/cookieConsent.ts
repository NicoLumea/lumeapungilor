export const COOKIE_CONSENT_KEY = "lumea_pungilor_cookie_consent";
export const COOKIE_PREFERENCES_EVENT = "lumea-pungilor:cookie-preferences";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export const NECESSARY_ONLY_CONSENT: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function normalizeConsent(value: Partial<CookieConsent>): CookieConsent {
  return {
    necessary: true,
    analytics: value.analytics === true,
    marketing: value.marketing === true,
  };
}

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!saved) return null;
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return normalizeConsent(parsed as Partial<CookieConsent>);
  } catch {
    // Storage can be blocked or unavailable. Optional consent must remain off.
    return null;
  }
}

export function setCookieConsent(value: Partial<CookieConsent>): CookieConsent {
  const consent = normalizeConsent(value);
  if (typeof window === "undefined") return NECESSARY_ONLY_CONSENT;

  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    return consent;
  } catch {
    // An unsaved choice must never grant optional consent.
    return NECESSARY_ONLY_CONSENT;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.analytics === true;
}

export function hasMarketingConsent(): boolean {
  return getCookieConsent()?.marketing === true;
}

export function openCookiePreferences(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT));
  }
}
