import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { formatRon } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { deliveryEstimate } from "@/lib/order-experience";
import { getOrderConfirmation, getOrderConfirmationPdf } from "@/lib/order-confirmation.functions";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/comanda/$number")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Confirmare comandă — Lumea Pungilor" },
      { name: "description", content: "Rezumatul securizat al comenzii tale." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: OrderConfirmation,
});

function OrderConfirmation() {
  const { number } = Route.useParams();
  const auth = useAuth();
  const load = useServerFn(getOrderConfirmation);
  const download = useServerFn(getOrderConfirmationPdf);
  const [busy, setBusy] = useState(false);
  const [accessToken] = useState(() =>
    typeof window === "undefined"
      ? undefined
      : (window.sessionStorage.getItem(`lp-order-access:${number}`) ?? undefined),
  );
  const query = useQuery({
    queryKey: ["order-confirmation", number, auth.user?.id, !!accessToken],
    enabled: !auth.loading,
    queryFn: () => load({ data: { number, accessToken } }),
    retry: false,
  });
  const order = query.data?.ok ? query.data.order : null;

  async function savePdf() {
    setBusy(true);
    try {
      const result = await download({ data: { number, accessToken } });
      if (!result.ok) throw new Error("Access denied");
      const binary = atob(result.base64);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `confirmare-comanda-${number}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Confirmarea PDF nu a putut fi descărcată.");
    } finally {
      setBusy(false);
    }
  }

  if (auth.loading || query.isLoading) {
    return (
      <p className="site-container py-28 text-center text-sm text-muted-foreground">
        Se încarcă rezumatul comenzii…
      </p>
    );
  }
  if (!order) {
    return (
      <div className="site-container max-w-[720px] py-28 text-center">
        <h1 className="display text-3xl">Comanda nu este disponibilă</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Autentifică-te în contul care a plasat comanda sau deschide confirmarea în aceeași sesiune
          în care ai comandat fără cont.
        </p>
        <Link
          to="/comenzile-mele"
          className="micro-sm mt-8 inline-flex min-h-11 items-center link-underline"
        >
          Comenzile mele
        </Link>
      </div>
    );
  }

  return (
    <div className="site-container max-w-[1000px] py-10 md:py-16">
      <p className="micro-sm text-muted-foreground">Confirmare comandă</p>
      <h1 className="display mt-3 text-3xl md:text-4xl">
        Cererea ta de comandă a fost înregistrată
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Echipa Lumea Pungilor va confirma disponibilitatea, livrarea și modalitatea de plată.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-border py-5">
        <div className="mr-auto">
          <p className="micro-sm text-muted-foreground">Comanda {order.order_number}</p>
          <p className="mt-1 text-sm">{new Date(order.created_at).toLocaleDateString("ro-RO")}</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={savePdf}
          className="micro-sm min-h-11 border border-foreground bg-foreground px-5 py-3 text-background disabled:opacity-50"
        >
          {busy ? "Se pregătește…" : "Descarcă confirmarea PDF"}
        </button>
      </div>
      <p className="mt-6 border border-border bg-field p-4 text-sm">
        {deliveryEstimate(order.city)}
      </p>

      <div className="mt-9 grid gap-7 md:grid-cols-2">
        <section className="border border-border p-5">
          <h2 className="display text-xl">Date client și livrare</h2>
          <div className="mt-4 space-y-1 text-sm">
            <p>{order.contact_name}</p>
            {order.company_name ? <p>{order.company_name}</p> : null}
            {order.cui ? <p>CUI: {order.cui}</p> : null}
            {order.reg_com ? <p>Registrul Comerțului: {order.reg_com}</p> : null}
            <p>{order.email}</p>
            {order.phone ? <p>{order.phone}</p> : null}
            <p className="whitespace-pre-line pt-2">{order.delivery_address}</p>
            <p>{[order.city, order.county, order.postal_code].filter(Boolean).join(", ")}</p>
          </div>
        </section>
        <section className="border border-border p-5">
          <h2 className="display text-xl">Facturare și plată</h2>
          <p className="mt-4 whitespace-pre-line text-sm">
            {order.billing_address || "Aceeași adresă ca livrarea"}
          </p>
          <p className="mt-4 text-sm">Metoda de livrare: de confirmat</p>
          <p className="mt-1 text-sm">Metoda de plată: de confirmat</p>
          <p className="mt-1 text-sm">Starea plății: {order.payment_status}</p>
          <p className="mt-1 text-sm">Starea comenzii: {order.status}</p>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="display text-2xl">Produse comandate</h2>
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {order.order_items.map((item) => {
            const image = imageUrl(item.product_image_url);
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-4 py-4 text-sm">
                {image ? (
                  <img src={image} alt="" className="size-20 shrink-0 bg-field object-contain" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  {item.variant_name ? (
                    <p className="text-muted-foreground">{item.variant_name}</p>
                  ) : null}
                  <p className="text-muted-foreground">
                    {item.quantity} × {formatRon(item.unit_price)}
                  </p>
                </div>
                <p className="font-medium">{formatRon(item.line_total)}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="ml-auto mt-7 max-w-sm space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span>Subtotal</span>
          <span>{formatRon(order.subtotal)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Livrare</span>
          <span>{formatRon(order.shipping_total)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Taxe / TVA înregistrate</span>
          <span>{formatRon(order.tax_total)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-3 font-medium">
          <span>Total</span>
          <span>{formatRon(order.total)}</span>
        </div>
      </section>
      <div className="mt-10 border-t border-border pt-6">
        <p className="micro-sm mb-3 text-muted-foreground">Datele vânzătorului</p>
        <CompanyIdentity sellerLabel showPhones />
      </div>
      <div className="mt-9 flex flex-wrap gap-5">
        <Link
          to="/comenzile-mele"
          className="micro-sm inline-flex min-h-11 items-center link-underline"
        >
          Comenzile mele
        </Link>
        <Link to="/produse" className="micro-sm inline-flex min-h-11 items-center link-underline">
          Înapoi la catalog
        </Link>
      </div>
    </div>
  );
}
