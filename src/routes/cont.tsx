import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AccountNav } from "@/components/site/AccountNav";
import { RequireAccess } from "@/components/site/RequireAccess";
import { useMyProfile } from "@/lib/dashboard-data";
import { useServerFn } from "@tanstack/react-start";
import { requestEmployeeAccess } from "@/lib/account.functions";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/cont")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Contul meu — Lumea Pungilor" },
      { name: "description", content: "Datele tale de contact și livrare." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <RequireAccess level="customer">{(auth) => <AccountPage userId={auth.user!.id} email={auth.user!.email ?? ""} />}</RequireAccess>,
});

const FIELDS: { key: string; label: string }[] = [
  { key: "full_name", label: "Nume și prenume" },
  { key: "phone", label: "Telefon" },
  { key: "company_name", label: "Firmă" },
  { key: "cui", label: "CUI" },
  { key: "billing_address", label: "Adresă de facturare" },
  { key: "delivery_address", label: "Adresă de livrare" },
  { key: "city", label: "Oraș" },
  { key: "county", label: "Județ" },
  { key: "postal_code", label: "Cod poștal" },
];

function AccountPage({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useMyProfile(userId);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState({ current: "", next: "" });
  const auth = useAuth();
  const askAccess = useServerFn(requestEmployeeAccess);
  const [accessNote, setAccessNote] = useState("");
  const [accessSent, setAccessSent] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const next: Record<string, string> = {};
    for (const f of FIELDS) next[f.key] = ((profile as Record<string, unknown>)[f.key] as string) ?? "";
    setForm(next);
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").update(form as never).eq("id", userId);
    setBusy(false);
    if (error) {
      toast.error("Datele nu au putut fi salvate.");
      return;
    }
    toast.success("Date salvate.");
    qc.invalidateQueries({ queryKey: ["account", "profile", userId] });
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.next.length < 8) {
      toast.error("Parola nouă trebuie să aibă cel puțin 8 caractere.");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: password.next,
      current_password: password.current,
    });
    if (error) {
      toast.error("Parola nu a putut fi schimbată. Verifică parola curentă.");
      return;
    }
    toast.success("Parolă schimbată.");
    setPassword({ current: "", next: "" });
  }

  return (
    <div className="site-container max-w-[1000px] py-10">
      <AccountNav />
      <h1 className="display mt-10 text-3xl">Profil</h1>
      <p className="mt-3 text-sm text-muted-foreground">{email}</p>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Se încarcă…</p>
      ) : (
        <form onSubmit={save} className="mt-8 grid gap-5 md:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="micro-sm text-muted-foreground">{f.label}</span>
              <input
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </label>
          ))}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="micro min-h-11 border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
            >
              {busy ? "Se salvează…" : "Salvează datele"}
            </button>
          </div>
        </form>
      )}

      {!auth.isStaff ? (
        <form
          className="mt-14 max-w-md space-y-4 border-t border-border pt-10"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await askAccess({ data: { message: accessNote || undefined } });
              if (!res.ok) {
                toast.error(res.error);
                return;
              }
              setAccessSent(true);
              toast.success("Cererea a fost trimisă unui administrator.");
            } catch {
              toast.error("Cererea nu a putut fi trimisă.");
            }
          }}
        >
          <h2 className="display text-xl">Lucrezi la Lumea Pungilor?</h2>
          <p className="text-sm text-muted-foreground">
            Poți cere acces de angajat. Cererea este activată doar după aprobarea unui administrator.
          </p>
          {accessSent ? (
            <p className="border border-border bg-field p-3 text-sm">
              Cererea ta așteaptă aprobarea unui administrator.
            </p>
          ) : (
            <>
              <textarea
                rows={3}
                value={accessNote}
                placeholder="Opțional: spune cine ești și ce rol ai."
                onChange={(e) => setAccessNote(e.target.value)}
                className="w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
              <button type="submit" className="micro min-h-11 border border-foreground px-6 py-3">
                Cere acces de angajat
              </button>
            </>
          )}
        </form>
      ) : null}

      <form onSubmit={changePassword} className="mt-14 max-w-md space-y-5 border-t border-border pt-10">
        <h2 className="display text-xl">Schimbă parola</h2>
        <label className="block">
          <span className="micro-sm text-muted-foreground">Parola curentă</span>
          <input
            type="password"
            required
            value={password.current}
            onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="block">
          <span className="micro-sm text-muted-foreground">Parolă nouă</span>
          <input
            type="password"
            required
            minLength={8}
            value={password.next}
            onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <button type="submit" className="micro min-h-11 border border-foreground px-6 py-3">
          Schimbă parola
        </button>
      </form>
    </div>
  );
}
