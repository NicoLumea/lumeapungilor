import { Link, useRouterState } from "@tanstack/react-router";
import { storageGet, storageSet } from "@/lib/safe-storage";
import { useEffect, useState } from "react";

const START_KEY = "lp-account-benefits-start";
const SHOWN_KEY = "lp-account-benefits-shown";

export function AccountBenefitsPopup({
  loading,
  signedIn,
}: {
  loading: boolean;
  signedIn: boolean;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [visible, setVisible] = useState(false);
  const excluded =
    pathname === "/checkout" ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/n7q4-v2m9") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/comanda/") ||
    pathname === "/autentificare";

  useEffect(() => {
    if (loading || signedIn || excluded) {
      setVisible(false);
      return;
    }
    if (storageGet("session", SHOWN_KEY)) return;
    const saved = Number(storageGet("session", START_KEY));
    const started = saved > 0 && saved <= Date.now() ? saved : Date.now();
    storageSet("session", START_KEY, String(started));
    let timer: number;
    const showWhenReady = () => {
      if (document.querySelector('[role="dialog"][data-state="open"]')) {
        timer = window.setTimeout(showWhenReady, 10_000);
        return;
      }
      storageSet("session", SHOWN_KEY, "1");
      setVisible(true);
    };
    timer = window.setTimeout(showWhenReady, Math.max(0, 60_000 - (Date.now() - started)));
    return () => window.clearTimeout(timer);
  }, [loading, signedIn, excluded]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 30_000);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;
  return (
    <div
      role="status"
      className="absolute right-4 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] border border-border bg-background p-5 shadow-lg md:right-8"
    >
      <button
        type="button"
        aria-label="Închide beneficiile contului"
        onClick={() => setVisible(false)}
        className="absolute right-3 top-2 grid size-10 place-items-center text-xl text-muted-foreground"
      >
        ×
      </button>
      <p className="pr-8 text-sm font-medium">Creează un cont pentru o experiență mai rapidă</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Vezi istoricul comenzilor, cumpără din nou și găsește produsele cumpărate anterior.
      </p>
      <div className="mt-4 flex flex-wrap gap-4">
        <Link
          to="/autentificare"
          search={{ redirect: "/cont" }}
          className="micro-sm inline-flex min-h-10 items-center border border-foreground bg-foreground px-3 text-background"
        >
          Creează cont
        </Link>
        <Link
          to="/autentificare"
          search={{ redirect: "/cont" }}
          className="micro-sm inline-flex min-h-10 items-center link-underline"
        >
          Autentificare
        </Link>
      </div>
    </div>
  );
}
