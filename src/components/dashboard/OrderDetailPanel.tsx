import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { OrderOperationsPanel } from "./OrderOperationsPanel";
import { supabase } from "@/integrations/supabase/client";
import { formatRon } from "@/lib/format";
import { imageUrl } from "@/lib/images";

function OrderItemPhoto({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded border border-border bg-field">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span role="img" aria-label="Fotografie indisponibilă" className="text-muted-foreground">
          <ImageOff aria-hidden="true" className="size-5" />
        </span>
      )}
    </div>
  );
}

export function OrderDetailPanel({
  id,
  base,
}: {
  id: string;
  base: "/staff/comenzi" | "/n7q4-v2m9/orders";
}) {
  const order = useQuery({
    queryKey: ["staff", "order-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,order_number,user_id,contact_name,email,phone,company_name,cui,reg_com,billing_address,delivery_address,city,county,postal_code,notes,internal_notes,status,payment_status,payment_method,subtotal,shipping_total,tax_total,total,currency,created_at,updated_at,updated_by,order_items(id,product_id,product_image_url,product_name,variant_name,sku,quantity,unit_price,line_total)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const o = order.data;
  const missingPhotoIds = [
    ...new Set(
      (o?.order_items ?? []).flatMap((item) =>
        item.product_id && !imageUrl(item.product_image_url) ? [item.product_id] : [],
      ),
    ),
  ].sort();
  const catalogPhotos = useQuery({
    queryKey: ["staff", "order-item-photos", missingPhotoIds],
    enabled: missingPhotoIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("product_id,url")
        .in("product_id", missingPhotoIds)
        .order("is_primary", { ascending: false })
        .order("sort_order")
        .order("created_at")
        .order("id");
      if (error) throw error;

      const photos: Record<string, string> = {};
      for (const image of data) {
        photos[image.product_id] ??= image.url;
      }
      return photos;
    },
  });
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
                  {o.order_items.map((it) => {
                    const photo =
                      imageUrl(it.product_image_url) ??
                      imageUrl(it.product_id ? catalogPhotos.data?.[it.product_id] : null);
                    return (
                      <tr key={it.id} className="border-b border-border/60">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <OrderItemPhoto key={photo} src={photo} />
                            <div>
                              {it.product_name}
                              {it.variant_name ? ` — ${it.variant_name}` : ""}
                              <br />
                              <span className="text-xs text-muted-foreground">{it.sku || "—"}</span>
                            </div>
                          </div>
                        </td>
                        <td>{it.quantity}</td>
                        <td>{formatRon(it.unit_price)}</td>
                        <td>{formatRon(it.line_total)}</td>
                      </tr>
                    );
                  })}
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
          <OrderOperationsPanel key={o.id + o.updated_at} order={o} />
        </>
      ) : null}
    </div>
  );
}
