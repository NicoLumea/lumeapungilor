import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthResult = { data: any; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Autorizare aplicație — Lumea Pungilor" },
      { name: "description", content: "Aprobă accesul unei aplicații la contul tău Lumea Pungilor." },
      { property: "og:title", content: "Autorizare aplicație — Lumea Pungilor" },
      { property: "og:description", content: "Aprobă accesul unei aplicații la contul tău." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Lipsește authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/autentificare", search: { redirect: next } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="site-container py-16 text-center text-sm">
      Cererea de autorizare nu a putut fi încărcată: {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? "o aplicație";

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("Serverul nu a returnat o adresă de redirecționare."); return; }
    window.location.href = target;
  }

  return (
    <main className="site-container max-w-[34rem] py-16 text-center">
      <h1 className="display text-3xl">Conectează {name} la contul tău</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        {name} va putea căuta produse și vedea comenzile tale în numele tău.
      </p>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-8 flex justify-center gap-3">
        <button disabled={busy} onClick={() => decide(true)} className="micro min-h-11 border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-50">Aprobă</button>
        <button disabled={busy} onClick={() => decide(false)} className="micro min-h-11 border border-foreground px-6 py-3 disabled:opacity-50">Refuză</button>
      </div>
    </main>
  );
}
