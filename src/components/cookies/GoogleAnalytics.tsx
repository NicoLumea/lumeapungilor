import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { COOKIE_CONSENT_CHANGED_EVENT, COOKIE_CONSENT_KEY } from "@/lib/cookieConsent";
import { syncGoogleAnalytics } from "@/lib/google-analytics";

export function GoogleAnalytics() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const sync = () => syncGoogleAnalytics(pathname);
    const storageChanged = (event: StorageEvent) => {
      if (event.key === COOKIE_CONSENT_KEY || event.key === null) sync();
    };
    sync();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
    window.addEventListener("storage", storageChanged);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
      window.removeEventListener("storage", storageChanged);
    };
  }, [pathname]);

  return null;
}
