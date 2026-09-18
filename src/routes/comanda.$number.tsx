import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { getOrderConfirmation } from "@/lib/shop.functions";
import { formatRon } from "@/lib/format";

export const Route = createFileRoute("/comanda/$number")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Comandă înregistrată — Lumea Pungilor" },
      { name: "description", content: "Confirmarea comenzii tale." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmation,
});

type Confirmation = NonNullable<Awaited<ReturnType<typeof getOrderConfirmation>>>;

function OrderConfirmation() {
  const { number } = Route.useParams();
  const fetchConfirmation = useServerFn(getOrderConfirmation);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem(`lp-order-token:${number}`);
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    fetchConfirmation({ data: { orderNumber: number, token } })
      .then((order) => {
        if (active) setConfirmation(order);
      })
      .catch(() => {
        if (active) setConfirmation(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [number, fetchConfirmation]);

  return (
    <div className="site-container max-w-[760px] py-20">
      <p className="micro-sm text-muted-foreground">Confirmare</p>
      <h1 className="display mt-4 text-3xl md:text-4xl">Comanda a fost înregistrată</h1>
      {loading ? (
        <p className="mt-6 text-sm">Se încarcă detaliile comenzii…</p>
      ) : confirmation ? (
        <>
          <p className="mt-6 text-sm">
            Referința comenzii: <strong>{confirmation.orderNumber}</strong>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Am înregistrat cererea. Te contactăm pentru confirmarea detaliilor. Nu a fost efectuată
            nicio plată online.
          </p>
          <ul className="mt-8 divide-y divide-border border-y border-border">
            {confirmation.items.map((item, index) => (
              <li key={index} className="flex justify-between gap-5 py-4 text-sm">
                <span className="min-w-0 break-words">
                  {item.product_name}
                  {item.variant_name ? ` — ${item.variant_name}` : ""} × {item.quantity}{" "}
                  {item.selling_unit ?? "seturi"}
                  {item.units_per_pack ? ` · ${item.units_per_pack} buc./set` : ""}
                </span>
                <span>{formatRon(item.line_total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatRon(confirmation.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Livrare</dt>
              <dd>{formatRon(confirmation.shipping)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>
                TVA ({confirmation.vatRate}%{confirmation.pricesIncludeVat ? ", inclus" : ""})
              </dt>
              <dd>{formatRon(confirmation.vat)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-semibold">
              <dt>Total</dt>
              <dd>{formatRon(confirmation.total)}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Detaliile comenzii nu sunt disponibile în această sesiune. Păstrează referința {number}{" "}
          pentru a contacta magazinul.
        </p>
      )}
      <div className="mt-8 border-y border-border py-5">
        <p className="micro-sm mb-3 text-muted-foreground">Datele vânzătorului</p>
        <CompanyIdentity sellerLabel showPhones />
      </div>
      <Link
        to="/produse"
        className="micro mt-10 inline-flex border border-foreground px-8 py-4 transition-colors hover:bg-foreground hover:text-background"
      >
        Continuă cumpărăturile
      </Link>
    </div>
  );
}
