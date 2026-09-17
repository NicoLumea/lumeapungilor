import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AccountNav } from "@/components/site/AccountNav";
import { RequireAccess } from "@/components/site/RequireAccess";
import { useMyReturns, RETURN_KIND_LABEL } from "@/lib/dashboard-data";
import { submitReturnRequest } from "@/lib/account.functions";

export const Route = createFileRoute("/retururi")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Retururi și reclamații — Lumea Pungilor" },
      { name: "description", content: "Cererile tale de retur, retragere și reclamație." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAccess level="customer">
      {(auth) => <MyReturns userId={auth.user!.id} email={auth.user!.email ?? ""} />}
    </RequireAccess>
  ),
});

const STATUS_LABEL: Record<string, string> = {
  nou: "Nou",
  in_lucru: "În lucru",
  rezolvat: "Rezolvat",
  respins: "Respins",
};

function MyReturns({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useMyReturns(userId);
  const submit = useServerFn(submitReturnRequest);
  const [form, setForm] = useState({ orderNumber: "", kind: "retur", message: "" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await submit({
        data: {
          orderNumber: form.orderNumber || undefined,
          email,
          kind: form.kind as "retur",
          message: form.message,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Cererea a fost trimisă.");
      setForm({ orderNumber: "", kind: "retur", message: "" });
      qc.invalidateQueries({ queryKey: ["account", "returns", userId] });
    } catch {
      toast.error("Cererea nu a putut fi trimisă.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="site-container max-w-[1000px] py-10">
      <AccountNav />
      <h1 className="display mt-10 text-3xl">Retururi și reclamații</h1>

      <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-5 border border-border p-6">
        <label className="block">
          <span className="micro-sm text-muted-foreground">Număr comandă (opțional)</span>
          <input
            value={form.orderNumber}
            onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="block">
          <span className="micro-sm text-muted-foreground">Tipul cererii</span>
          <select
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm"
          >
            {Object.entries(RETURN_KIND_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="micro-sm text-muted-foreground">Detalii</span>
          <textarea
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="micro min-h-11 border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
        >
          {busy ? "Se trimite…" : "Trimite cererea"}
        </button>
      </form>

      {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Se încarcă…</p> : null}
      <ul className="mt-8 space-y-4">
        {(data ?? []).map((r) => (
          <li key={r.id} className="border border-border p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="micro-sm">{RETURN_KIND_LABEL[r.kind] ?? r.kind}</span>
              <span className="text-sm text-muted-foreground">{r.order_number ?? "—"}</span>
              <span className="ml-auto text-sm">{STATUS_LABEL[r.status] ?? r.status}</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{r.message}</p>
            {r.resolution ? (
              <p className="mt-3 border-l border-brand pl-4 text-sm">{r.resolution}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
