import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthPanel } from "@/components/site/AuthPanel";

type AuthSearch = { redirect?: string };

function safeRedirect(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/cont";
}

export const Route = createFileRoute("/autentificare")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: safeRedirect(search["redirect"]),
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
  const { redirect = "/cont" } = Route.useSearch();
  const destination = safeRedirect(redirect);
  const continueToDestination = () => void navigate({ to: destination });

  return (
    <div className="site-container max-w-[34rem] py-12 md:py-20">
      <div className="text-center">
        <h1 className="display text-3xl md:text-4xl">Contul tău</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Autentifică-te sau creează un cont. Poți răsfoi magazinul și comanda și fără cont.
        </p>
      </div>
      <div className="mt-8">
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
