import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminOrders } from "@/lib/admin-data";
import { formatRon } from "@/lib/format";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["nou", "confirmat", "in_livrare", "finalizat", "anulat"] as const;
const STATUS_LABEL: Record<string, string> = {
  nou: "Nou",
  confirmat: "Confirmat",
  in_livrare: "În livrare",
  finalizat: "Finalizat",
  anulat: "Anulat",
};

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders, isLoading } = useAdminOrders();
  const [open, setOpen] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status actualizat.");
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  }

  async function saveNote(id: string, internal_notes: string) {
    const { error } = await supabase.from("orders").update({ internal_notes }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notiță salvată.");
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="display text-3xl">Comenzi</h1>

      {isLoading ? (
        <p className="py-16 text-sm text-muted-foreground">Se încarcă…</p>
      ) : (orders ?? []).length === 0 ? (
        <p className="py-16 text-sm text-muted-foreground">Nu există comenzi încă.</p>
      ) : (
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {(orders ?? []).map((o) => (
            <li key={o.id} className="py-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm">
                    {o.order_number} · {o.contact_name}
                    {o.company_name ? ` · ${o.company_name}` : ""}
                    {o.is_test ? " · TEST" : ""}
                  </p>
                  <p className="micro-sm text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("ro-RO")} · {o.email}
                    {o.phone ? ` · ${o.phone}` : ""}
                  </p>
                </div>
                <p className="text-sm">{formatRon(Number(o.total))}</p>
                <select
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value)}
                  aria-label="Status comandă"
                  className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="micro-sm link-underline"
                  onClick={() => setOpen(open === o.id ? null : o.id)}
                >
                  {open === o.id ? "Ascunde" : "Detalii"}
                </button>
              </div>

              {open === o.id ? (
                <div className="mt-5 grid gap-6 border-t border-border pt-5 md:grid-cols-2">
                  <div>
                    <p className="micro-sm text-muted-foreground">Produse</p>
                    <ul className="mt-3 space-y-2 text-sm">
                      {(o.order_items ?? []).map(
                        (it: {
                          id: string;
                          product_name: string;
                          variant_name: string | null;
                          quantity: number;
                          selling_unit: string | null;
                          line_total: number;
                        }) => (

                          <li key={it.id} className="flex justify-between gap-4">
                            <span>
                              {it.product_name}
                              {it.variant_name ? ` — ${it.variant_name}` : ""} × {it.quantity}{" "}
                              {it.selling_unit}
                            </span>
                            <span>{formatRon(Number(it.line_total))}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p className="micro-sm text-muted-foreground">Date client</p>
                    <p className="whitespace-pre-line text-muted-foreground">
                      {[
                        o.company_name,
                        o.cui ? `CUI ${o.cui}` : null,
                        o.reg_com,
                        o.billing_address,
                        o.delivery_address,
                        [o.city, o.county, o.postal_code].filter(Boolean).join(", "),
                        o.notes ? `Observații: ${o.notes}` : null,
                      ]
                        .filter(Boolean)
                        .join("\n") || "Fără detalii suplimentare."}
                    </p>
                    <label className="block">
                      <span className="micro-sm text-muted-foreground">Notiță internă</span>
                      <textarea
                        rows={3}
                        defaultValue={o.internal_notes ?? ""}
                        onBlur={(e) => {
                          if (e.target.value !== (o.internal_notes ?? "")) {
                            saveNote(o.id, e.target.value);
                          }
                        }}
                        className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                      />
                    </label>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
