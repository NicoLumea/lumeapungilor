import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountNav } from "@/components/site/AccountNav";
import { RequireAccess } from "@/components/site/RequireAccess";
import { useMyOrders } from "@/lib/dashboard-data";
import { formatRon } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { usePublishedProducts } from "@/lib/products";
import { repeatPurchaseLine } from "@/lib/order-experience";
import { useCart } from "@/lib/cart";
import { isPaidStatus, RETURN_STATUS_LABEL } from "@/lib/returns-core";
import { toast } from "sonner";

export const Route = createFileRoute("/comenzile-mele")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Comenzile mele — Lumea Pungilor" },
      { name: "description", content: "Istoricul comenzilor tale." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAccess level="customer">{(auth) => <MyOrders userId={auth.user!.id} />}</RequireAccess>
  ),
});

const STATUS_LABEL: Record<string, string> = {
  nou: "Nou",
  confirmat: "Confirmat",
  in_livrare: "În livrare",
  finalizat: "Finalizat",
  anulat: "Anulat",
};

function MyOrders({ userId }: { userId: string }) {
  const { data, isLoading, error } = useMyOrders(userId);
  const { data: currentProducts } = usePublishedProducts();
  const { add } = useCart();

  return (
    <div className="site-container max-w-[1000px] py-10">
      <AccountNav />
      <h1 className="display mt-10 text-3xl">Comenzile mele</h1>

      {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Se încarcă…</p> : null}
      {error ? (
        <p className="mt-8 text-sm text-destructive">Comenzile nu au putut fi încărcate.</p>
      ) : null}
      {!isLoading && !error && (data ?? []).length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Nu ai încă nicio comandă.{" "}
          <Link to="/produse" className="link-underline">
            Vezi catalogul
          </Link>
          .
        </p>
      ) : null}

      <ul className="mt-8 space-y-4">
        {(data ?? []).map((o) => {
          const activeReturn = (o.return_requests ?? []).find(
            (request) => !["rejected", "closed"].includes(request.status),
          );
          return (
            <li key={o.id} className="border border-border p-5">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="micro">{o.order_number}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("ro-RO")}
                </span>
                <span className="text-sm">Livrare: {STATUS_LABEL[o.status] ?? o.status}</span>
                <span className="text-sm">Plată: {o.payment_status}</span>
                <span className="ml-auto text-sm">{formatRon(Number(o.total))}</span>
              </div>
              <ul className="mt-4 space-y-3">
                {(o.order_items ?? []).map((item) => {
                  const current = currentProducts?.find(
                    (product) => product.id === item.product_id,
                  );
                  const repeat = repeatPurchaseLine(current, item.variant_id);
                  const image = imageUrl(item.product_image_url);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-sm"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="size-16 shrink-0 bg-field object-contain"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p>
                          {item.product_name}
                          {item.variant_name ? ` · ${item.variant_name}` : ""}
                        </p>
                        <p className="text-muted-foreground">
                          {item.quantity} × {formatRon(Number(item.unit_price))} ·{" "}
                          {formatRon(Number(item.line_total))}
                        </p>
                      </div>
                      {repeat ? (
                        <button
                          type="button"
                          className="micro-sm min-h-11 border border-border px-3 py-2 hover:border-foreground"
                          onClick={() => {
                            add(repeat);
                            toast.success("Produs adăugat în coș la prețul actual.");
                          }}
                        >
                          Cumpără din nou
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <Link
                to="/comanda/$number"
                params={{ number: o.order_number }}
                className="micro-sm mt-4 inline-flex min-h-11 items-center link-underline"
              >
                Vezi comanda
              </Link>
              {activeReturn ? (
                <p className="micro-sm mt-4">
                  Cerere de retur: {RETURN_STATUS_LABEL[activeReturn.status] ?? activeReturn.status}
                </p>
              ) : isPaidStatus(o.payment_status) ? (
                <Link
                  to="/retururi"
                  search={{ order: o.order_number }}
                  className="micro-sm mt-4 inline-flex min-h-11 items-center link-underline"
                >
                  Solicită retur / Trimite reclamație
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
