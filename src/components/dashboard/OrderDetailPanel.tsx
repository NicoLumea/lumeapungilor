import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatRon } from "@/lib/format";

const STATUSES = ["nou", "confirmat", "in_livrare", "finalizat", "anulat"];
const PAYMENTS = ["in_asteptare", "platit", "rambursat", "anulat"];

export function OrderDetailPanel({
  id,
  base,
}: {
  id: string;
  base: "/staff/comenzi" | "/n7q4-v2m9/orders";
}) {
  const qc = useQueryClient();
  const order = useQuery({
    queryKey: ["staff", "order-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,order_number,user_id,contact_name,email,phone,company_name,cui,reg_com,billing_address,delivery_address,city,county,postal_code,notes,internal_notes,status,payment_status,payment_method,subtotal,shipping_total,tax_total,total,currency,created_at,updated_at,updated_by,order_items(id,product_name,variant_name,sku,quantity,unit_price,line_total)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (order.data) {
      setStatus(order.data.status);
      setPayment(order.data.payment_status);
      setNote(order.data.internal_notes ?? "");
    }
  }, [order.data]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!order.data) return;
    setSaving(true);
    const { error } = await supabase
      .from("orders")
      .update({
        status,
        payment_status: payment,
        internal_notes: note,
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Comanda a fost actualizată.");
    await qc.invalidateQueries({ queryKey: ["staff", "order-detail", id] });
    await qc.invalidateQueries({ queryKey: ["staff", "orders"] });
  }

  const o = order.data;
  return (
    <div className="mx-auto max-w-[1100px]">
      <Link to={base as "/staff/comenzi"} className="micro-sm underline underline-offset-4">
        ← Înapoi la comenzi
      </Link>
      {order.isLoading ? <p className="mt-8 text-sm">Se încarcă…</p> : null}
      {order.error ? (
        <p className="mt-8 text-sm text-destructive">Comanda nu a putut fi încărcată.</p>
      ) : null}
      {!order.isLoading && !o ? <p className="mt-8 text-sm">Comanda nu a fost găsită.</p> : null}
      {o ? (
        <>
          <h1 className="display mt-5 text-3xl">Comanda {o.order_number}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(o.created_at).toLocaleString("ro-RO")} ·{" "}
            {o.user_id ? "Client înregistrat" : "Fără cont"}
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="border border-border p-5 text-sm">
              <h2 className="display text-xl">Client și livrare</h2>
              <dl className="mt-4 space-y-2">
                <div>
                  <dt className="text-muted-foreground">Nume / e-mail</dt>
                  <dd>
                    {o.contact_name} · {o.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Telefon / firmă</dt>
                  <dd>
                    {o.phone || "—"} · {o.company_name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cont</dt>
                  <dd className="break-all">{o.user_id || "Fără cont"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Adresă de livrare</dt>
                  <dd className="whitespace-pre-line">
                    {o.delivery_address || "—"}
                    <br />
                    {[o.city, o.county, o.postal_code].filter(Boolean).join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Facturare / observații</dt>
                  <dd className="whitespace-pre-line">
                    {o.billing_address || "—"}
                    <br />
                    {o.notes || ""}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="border border-border p-5 text-sm">
              <h2 className="display text-xl">Plată și situație</h2>
              <p className="mt-4">
                Metodă: {o.payment_method === "cash" ? "Numerar" : "De confirmat"}
              </p>
              <p className="mt-2">
                Status: {o.status} · Plată: {o.payment_status}
              </p>
              <p className="mt-2 text-muted-foreground">
                Actualizat: {new Date(o.updated_at).toLocaleString("ro-RO")}
              </p>
              {o.updated_by ? (
                <p className="mt-1 break-all text-muted-foreground">Modificat de: {o.updated_by}</p>
              ) : null}
            </section>
          </div>
          <section className="mt-8 border border-border p-5">
            <h2 className="display text-xl">Produse</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2">Produs / SKU</th>
                    <th>Cantitate</th>
                    <th>Preț unitar</th>
                    <th>Total linie</th>
                  </tr>
                </thead>
                <tbody>
                  {o.order_items.map((it) => (
                    <tr key={it.id} className="border-b border-border/60">
                      <td className="py-3">
                        {it.product_name}
                        {it.variant_name ? ` — ${it.variant_name}` : ""}
                        <br />
                        <span className="text-xs text-muted-foreground">{it.sku || "—"}</span>
                      </td>
                      <td>{it.quantity}</td>
                      <td>{formatRon(it.unit_price)}</td>
                      <td>{formatRon(it.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto mt-5 max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatRon(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Livrare</dt>
                <dd>{formatRon(o.shipping_total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>TVA</dt>
                <dd>{formatRon(o.tax_total)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-medium">
                <dt>Total</dt>
                <dd>{formatRon(o.total)}</dd>
              </div>
            </dl>
          </section>
          <form onSubmit={save} className="mt-8 border border-border p-5">
            <h2 className="display text-xl">Informații operaționale</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Prețurile, cantitățile și sumele inițiale nu pot fi modificate. Anularea restituie
              stocul o singură dată și nu poate fi inversată.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Status comandă
                <select
                  value={status}
                  disabled={o.status === "anulat"}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-2 block w-full border border-input bg-background px-3 py-2"
                >
                  {STATUSES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Status plată
                <select
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="mt-2 block w-full border border-input bg-background px-3 py-2"
                >
                  {PAYMENTS.includes(payment) ? null : <option value={payment}>{payment}</option>}
                  {PAYMENTS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-5 block text-sm">
              Notițe interne
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-2 block w-full border border-input bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="micro mt-5 min-h-11 border border-foreground bg-foreground px-6 text-background disabled:opacity-40"
            >
              {saving ? "Se salvează…" : "Salvează"}
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
