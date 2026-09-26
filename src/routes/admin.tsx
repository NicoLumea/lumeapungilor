import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { claimOwnerAccess } from "@/lib/shop.functions";
import { AccessDenied } from "@/components/site/AccessDenied";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administrare — Lumea Pungilor" },
      { name: "description", content: "Panou de administrare al magazinului." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV: { to: string; label: string; exact: boolean }[] = [
  { to: "/admin", label: "Prezentare", exact: true },
  { to: "/admin/products", label: "Produse", exact: false },
  { to: "/admin/categories", label: "Categorii", exact: false },
  { to: "/admin/orders", label: "Comenzi", exact: false },
  { to: "/admin/utilizatori", label: "Utilizatori și interes", exact: false },
  { to: "/admin/clienti", label: "Clienți", exact: false },
  { to: "/admin/roluri", label: "Angajați și accese", exact: false },
  { to: "/admin/retururi", label: "Retururi", exact: false },
  { to: "/admin/stoc", label: "Cereri revenire stoc", exact: false },
  { to: "/admin/mesaje", label: "Mesaje", exact: false },
  { to: "/admin/content", label: "Conținut site", exact: false },
  { to: "/admin/setari", label: "Setări", exact: false },
  { to: "/admin/audit", label: "Jurnal de audit", exact: false },
  { to: "/admin/guide", label: "Ghid", exact: false },
];

function AdminLayout() {
  const { user, isAdmin, loading, refresh } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isUsersDashboard = pathname === "/admin/utilizatori";

  if (loading) {
    return <p className="py-32 text-center text-sm text-muted-foreground">Se încarcă…</p>;
  }

  if (!user) return isUsersDashboard ? <AdminLoginRedirect /> : <AuthCard />;
  if (!isAdmin && isUsersDashboard) {
    return (
      <AccessDenied
        title="Acces interzis"
        message="Această pagină este disponibilă exclusiv administratorilor. Conturile de client și angajat nu pot consulta adresele de e-mail ale conturilor înregistrate."
      />
    );
  }
  if (!isAdmin) return <ClaimCard onClaimed={refresh} email={user.email ?? ""} userId={user.id} />;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-border px-4 py-4 md:px-8">
        <Link to="/magazin" className="micro">
          Lumea Pungilor
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/admin"}
              activeOptions={{ exact: item.exact }}
              activeProps={{ className: "micro-sm text-foreground underline underline-offset-4" }}
              inactiveProps={{ className: "micro-sm text-muted-foreground hover:text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="micro-sm ml-auto text-muted-foreground hover:text-foreground"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.assign("/");
          }}
        >
          Ieșire
        </button>
      </header>
      <main className="px-4 py-10 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function AdminLoginRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin", replace: true });
  }, [navigate]);
  return (
    <p className="py-32 text-center text-sm text-muted-foreground">
      Redirecționare către autentificarea de administrare…
    </p>
  );
}

function AuthCard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin" });
    } catch {
      toast.error("Autentificare eșuată. Verifică datele introduse.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-28">
      <h1 className="display text-2xl">Administrare</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Zonă rezervată angajaților și administratorilor. Conturile de administrare se creează doar
        intern, de către un administrator existent.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="micro-sm text-muted-foreground">E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="block">
          <span className="micro-sm text-muted-foreground">Parolă</span>
          <span className="relative mt-2 block">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-input bg-background px-3 py-2 pr-24 text-sm outline-none focus:border-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              className="micro-sm absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? "Ascunde" : "Afișează"}
            </button>
          </span>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="micro w-full border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
        >
          {busy ? "Se procesează…" : "Intră în cont"}
        </button>
      </form>
    </div>
  );
}

function ClaimCard({
  onClaimed,
  email,
  userId,
}: {
  onClaimed: () => void;
  email: string;
  userId: string;
}) {
  const claim = useServerFn(claimOwnerAccess);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-[480px] px-4 py-28">
      <h1 className="display text-2xl">Acces proprietar</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Ești autentificat ca {email}, dar contul nu are încă drepturi de administrare. Introdu codul
        de proprietar o singură dată pentru a le activa.
      </p>
      <form
        className="mt-8 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const res = await claim({ data: { code, userId } });
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success("Acces activat.");
            onClaimed();
          } catch {
            toast.error("Codul nu a putut fi verificat.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block">
          <span className="micro-sm text-muted-foreground">Cod de proprietar</span>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
