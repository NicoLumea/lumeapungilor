import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AccessDenied } from "@/components/site/AccessDenied";
import { RequireAccess } from "@/components/site/RequireAccess";
import { supabase } from "@/integrations/supabase/client";
import { claimOwnerAccess, getOwnerBootstrapStatus } from "@/lib/shop.functions";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/n7q4-v2m9")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Portal intern — Lumea Pungilor" },
      { name: "description", content: "Portal intern Lumea Pungilor." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdministrationLayout,
});

const NAV = [
  { to: "/n7q4-v2m9", label: "Prezentare", exact: true },
  { to: "/n7q4-v2m9/products", label: "Produse", exact: false },
  { to: "/n7q4-v2m9/categories", label: "Categorii", exact: false },
  { to: "/n7q4-v2m9/orders", label: "Comenzi", exact: false },
  { to: "/n7q4-v2m9/utilizatori", label: "Utilizatori și interes", exact: false },
  { to: "/n7q4-v2m9/clienti", label: "Clienți", exact: false },
  { to: "/n7q4-v2m9/livrare", label: "Livrare", exact: false },
  { to: "/n7q4-v2m9/roluri", label: "Angajați și accese", exact: false },
  { to: "/n7q4-v2m9/retururi", label: "Retururi", exact: false },
  { to: "/n7q4-v2m9/stoc", label: "Cereri revenire stoc", exact: false },
  { to: "/n7q4-v2m9/mesaje", label: "Mesaje", exact: false },
  { to: "/n7q4-v2m9/feedback", label: "Feedback", exact: false },
  { to: "/n7q4-v2m9/content", label: "Conținut site", exact: false },
  { to: "/n7q4-v2m9/seo", label: "SEO", exact: false },
  { to: "/n7q4-v2m9/setari", label: "Setări", exact: false },
  { to: "/n7q4-v2m9/audit", label: "Jurnal de audit", exact: false },
  { to: "/n7q4-v2m9/guide", label: "Ghid", exact: false },
] as const;

function AdministrationLayout() {
  const auth = useAuth();

  if (auth.loading) {
    return <p className="py-32 text-center text-sm text-muted-foreground">Se încarcă…</p>;
  }

  if (auth.user && !auth.isAdmin) {
    return <OwnerBootstrapGate email={auth.user.email ?? ""} onClaimed={auth.refresh} />;
  }

  return (
    <RequireAccess level="admin">
      {() => (
        <DashboardShell title="Administrare" nav={[...NAV]}>
          <Outlet />
        </DashboardShell>
      )}
    </RequireAccess>
  );
}

function OwnerBootstrapGate({ email, onClaimed }: { email: string; onClaimed: () => void }) {
  const getStatus = useServerFn(getOwnerBootstrapStatus);
  const claim = useServerFn(claimOwnerAccess);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getStatus()
      .then((result) => {
        if (active) setAvailable(result.available);
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, [getStatus]);

  if (available === null) {
    return <p className="py-32 text-center text-sm text-muted-foreground">Se verifică accesul…</p>;
  }

  if (!available) {
    return (
      <AccessDenied message="Contul tău nu are drepturile necesare pentru această secțiune. Configurarea inițială a proprietarului este închisă." />
    );
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-28">
      <h1 className="display text-2xl">Acces proprietar</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Ești autentificat ca {email}. Introdu codul privat o singură dată pentru a activa contul de
        proprietar configurat pentru această adresă.
      </p>
      <form
        className="mt-8 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            const result = await claim({ data: { code } });
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Accesul de proprietar a fost activat.");
            onClaimed();
          } catch {
            toast.error("Codul nu a putut fi verificat.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block">
          <span className="micro-sm text-muted-foreground">Cod privat de configurare</span>
          <input
            required
            type="password"
            autoComplete="off"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="micro w-full border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
        >
          {busy ? "Se verifică…" : "Activează accesul"}
        </button>
      </form>
      <button
        type="button"
        className="micro-sm mt-6 link-underline"
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.assign("/");
        }}
      >
        Ieșire
      </button>
    </div>
  );
}
