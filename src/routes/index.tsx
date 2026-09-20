import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthPanel } from "@/components/site/AuthPanel";
import { useAuth } from "@/lib/use-auth";
import { grantGuestAccess, hasGuestAccess } from "@/lib/guest-access";

type EntrySearch = { redirect?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): EntrySearch => {
    const raw = typeof search["redirect"] === "string" ? (search["redirect"] as string) : "";
    return raw.startsWith("/") ? { redirect: raw } : {};
  },
  head: () => ({
    meta: [
      { title: "Lumea Pungilor — Ambalaje pentru afaceri" },
      {
        name: "description",
        content:
          "Furnizor de pungi de plastic, fețe de masă și folie cu bule. Intră în magazin sau creează-ți un cont de client.",
      },
      { property: "og:title", content: "Lumea Pungilor — Ambalaje pentru afaceri" },
      {
        property: "og:description",
        content: "Ambalaje pentru afaceri: catalog, cont de client și comenzi online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntryPage,
});

function EntryPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const auth = useAuth();

  useEffect(() => {
    if (auth.loading) return;
    if (auth.user || (hasGuestAccess() && !search.redirect)) {
      void navigate({ to: "/magazin", replace: true });
    }
  }, [auth.loading, auth.user, navigate, search.redirect]);

  function enterAsGuest() {
    grantGuestAccess();
    void navigate({ to: "/magazin", replace: true });
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-hero px-5 py-6">
      <section className="w-full max-w-[27rem] bg-background px-5 py-7 sm:border sm:border-border sm:px-8 sm:py-8">
        <div className="text-center">
          <p className="text-xl font-semibold uppercase leading-none tracking-[0.035em] sm:text-2xl">
            Lumea Pungilor
          </p>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Bine ai venit. Autentifică-te, creează un cont sau continuă direct în magazin.
          </p>
        </div>

        {auth.loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Se verifică accesul…</p>
        ) : (
          <div className="mt-7">
            <AuthPanel
              onSignedIn={() => void navigate({ to: "/magazin", replace: true })}
              onSignedUp={() => {
                grantGuestAccess();
                void navigate({ to: "/magazin", replace: true });
              }}
            />
            <button
              type="button"
              onClick={enterAsGuest}
              className="micro mt-3 min-h-11 w-full border border-foreground px-6 py-3 transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Continuă ca vizitator
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
