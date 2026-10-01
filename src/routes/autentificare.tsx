import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthPanel } from "@/components/site/AuthPanel";

type AuthSearch = { redirect?: string; reset?: "success" };

function safeRedirect(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/cont";
}

export const Route = createFileRoute("/autentificare")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: safeRedirect(search["redirect"]),
    ...(search["reset"] === "success" ? { reset: "success" as const } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Autentificare — Lumea Pungilor" },
      { name: "description", content: "Autentifică-te sau creează un cont de client." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthenticationPage,
});

function AuthenticationPage() {
  const navigate = useNavigate();
  const { redirect = "/cont", reset } = Route.useSearch();
  const destination = safeRedirect(redirect);
  const continueToDestination = () => void navigate({ to: destination });

  return (
    <div className="site-container max-w-[34rem] py-12 md:py-20">
      <div className="text-center">
        <h1 className="display text-3xl md:text-4xl">Contul tău</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Autentifică-te sau creează un cont. Poți răsfoi magazinul și comanda și fără cont.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Cu un cont poți vedea istoricul comenzilor, poți cumpăra din nou produsele disponibile și
          îți poți urmări retururile.
        </p>
      </div>
      <div className="mt-8">
        {reset === "success" ? (
          <p role="status" className="mb-6 border border-border bg-field p-4 text-sm">
            Parola a fost actualizată. Conectează-te folosind noua parolă.
          </p>
        ) : null}
        <AuthPanel
          emailRedirectTo={destination}
          onSignedIn={continueToDestination}
          onSignedUp={(authenticated) => {
            if (authenticated) continueToDestination();
          }}
        />
      </div>
    </div>
  );
}
