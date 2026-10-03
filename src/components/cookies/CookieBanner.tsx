import { useEffect, useState } from "react";
import { CookiePreferences } from "@/components/cookies/CookiePreferences";
import {
  COOKIE_PREFERENCES_EVENT,
  getCookieConsent,
  NECESSARY_ONLY_CONSENT,
  setCookieConsent,
  type CookieConsent,
} from "@/lib/cookieConsent";

const ALL_CONSENT: CookieConsent = {
  necessary: true,
  analytics: true,
  marketing: true,
};

export function CookieBanner() {
  const [consent, setConsent] = useState<CookieConsent>(NECESSARY_ONLY_CONSENT);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const saved = getCookieConsent();
    setConsent(saved ?? NECESSARY_ONLY_CONSENT);
    setShowBanner(saved === null);

    const openPreferences = () => {
      setConsent(getCookieConsent() ?? NECESSARY_ONLY_CONSENT);
      setShowPreferences(true);
    };
    window.addEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);
  }, []);

  function save(next: CookieConsent) {
    setConsent(setCookieConsent(next));
    setShowBanner(false);
    setShowPreferences(false);
  }

  return (
    <>
      {showBanner ? (
        <section
          aria-label="Preferințe cookie"
          className="fixed inset-x-4 bottom-24 z-30 max-h-[calc(100dvh-7rem)] max-w-xl overflow-y-auto border border-border bg-background p-5 shadow-xl sm:bottom-6 sm:left-6 sm:right-auto sm:max-h-[calc(100dvh-3rem)]"
        >
          <p className="text-sm leading-relaxed text-foreground">
            Folosim tehnologii strict necesare pentru funcționarea site-ului. Cookie-urile opționale
            vor fi utilizate numai cu acordul dumneavoastră.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => save(ALL_CONSENT)}
              className="min-h-11 border border-foreground bg-foreground px-4 py-2 text-sm text-background"
            >
              Acceptă toate
            </button>
            <button
              type="button"
              onClick={() => save(NECESSARY_ONLY_CONSENT)}
              className="min-h-11 border border-border px-4 py-2 text-sm text-foreground"
            >
              Doar necesare
            </button>
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className="min-h-11 px-3 py-2 text-sm text-foreground underline underline-offset-4"
            >
              Setări cookie
            </button>
          </div>
        </section>
      ) : null}
      <CookiePreferences
        open={showPreferences}
        onOpenChange={setShowPreferences}
        consent={consent}
        onSave={save}
      />
    </>
  );
}
