import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { lookupGuestOrder, submitGuestReturnRequest } from "@/lib/account.functions";
import { formatRon } from "@/lib/format";
import { RETURN_KIND_LABEL } from "@/lib/dashboard-data";

export const Route = createFileRoute("/ajutor-comanda")({
  head: () => ({
    meta: [
      { title: "Ajutor pentru o comandă fără cont — Lumea Pungilor" },
      {
        name: "description",
        content:
          "Găsește-ți comanda plasată fără cont folosind numărul comenzii și adresa de e-mail, și trimite o cerere de retur sau o reclamație.",
      },
      { property: "og:title", content: "Ajutor pentru o comandă fără cont — Lumea Pungilor" },
      {
        property: "og:description",
        content: "Caută comanda după număr și e-mail și trimite o cerere de retur sau reclamație.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuestOrderHelp,
});

type FoundOrder = {
  order_number: string;
  status: string;
  total: number;
  created_at: string;
};

function GuestOrderHelp() {
  const lookup = useServerFn(lookupGuestOrder);
  const submit = useServerFn(submitGuestReturnRequest);
  const [form, setForm] = useState({ orderNumber: "", email: "" });
  const [order, setOrder] = useState<FoundOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [request, setRequest] = useState({ kind: "retur", message: "" });

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await lookup({ data: { orderNumber: form.orderNumber.trim(), email: form.email.trim() } });
      if (!res.ok) {
        setOrder(null);
        toast.error(res.error);
        return;
      }
      setOrder(res.order as FoundOrder);
    } catch {
      toast.error("Căutarea nu a putut fi efectuată.");
    } finally {
      setBusy(false);
    }
  }

  async function onRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    setBusy(true);
    try {
      const res = await submit({
        data: {
          orderNumber: order.order_number,
          email: form.email.trim(),
          kind: request.kind as "retur",
          message: request.message,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Cererea a fost înregistrată. Te contactăm pe e-mail.");
      setRequest({ kind: "retur", message: "" });
    } catch {
      toast.error("Cererea nu a putut fi trimisă.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="site-container max-w-[820px] py-14">
      <h1 className="display text-3xl md:text-4xl">Ajutor pentru o comandă fără cont</h1>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        Dacă ai comandat fără să îți creezi cont, îți poți găsi comanda folosind numărul ei și adresa de
        e-mail pe care ai folosit-o. De aici poți trimite o cerere de retur, de retragere din contract, o
        reclamație sau o sesizare pentru un produs defect. Drepturile tale legale de consumator rămân
        aceleași, indiferent dacă ai sau nu un cont.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Detaliile complete sunt în{" "}
        <Link to="/retur" className="link-underline">
          politica de retur
        </Link>{" "}
        și în{" "}
        <Link to="/termeni" className="link-underline">
          termeni și condiții
        </Link>
        .
      </p>

      <form onSubmit={onLookup} className="mt-10 space-y-5 border border-border p-6">
        <label className="block">
          <span className="micro-sm text-muted-foreground">Număr comandă</span>
          <input
            required
            value={form.orderNumber}
            onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="block">
          <span className="micro-sm text-muted-foreground">E-mail folosit la comandă</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="micro min-h-11 border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
        >
          {busy ? "Se caută…" : "Caută comanda"}
        </button>
      </form>

      {order ? (
        <div className="mt-10 border border-border p-6">
          <p className="micro-sm text-muted-foreground">Comanda găsită</p>
          <p className="mt-3 text-sm">
            {order.order_number} — {new Date(order.created_at).toLocaleDateString("ro-RO")} —{" "}
            {formatRon(Number(order.total))} — {order.status}
          </p>

          <form onSubmit={onRequest} className="mt-8 space-y-5 border-t border-border pt-6">
            <label className="block">
              <span className="micro-sm text-muted-foreground">Tipul cererii</span>
              <select
                value={request.kind}
                onChange={(e) => setRequest((r) => ({ ...r, kind: e.target.value }))}
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
                value={request.message}
                onChange={(e) => setRequest((r) => ({ ...r, message: e.target.value }))}
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="micro min-h-11 border border-foreground px-6 py-3 disabled:opacity-40"
            >
              {busy ? "Se trimite…" : "Trimite cererea"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
