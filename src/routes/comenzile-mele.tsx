import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountNav } from "@/components/site/AccountNav";
import { RequireAccess } from "@/components/site/RequireAccess";
import { useMyOrders } from "@/lib/dashboard-data";
import { formatRon } from "@/lib/format";

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

  return (
    <div className="site-container max-w-[1000px] py-10">
      <AccountNav />
      <h1 className="display mt-10 text-3xl">Comenzile mele</h1>

      {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Se încarcă…</p> : null}
      {error ? (
        <p className="mt-8 text-sm text-destructive">Comenzile nu au putut fi încărcate.</p>
      ) : null}
      {!isLoading && (data ?? []).length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Nu ai încă nicio comandă.{" "}
          <Link to="/produse" className="link-underline">
            Vezi catalogul
          </Link>
          .
        </p>
      ) : null}

      <ul className="mt-8 space-y-4">
        {(data ?? []).map((o) => (
          <li key={o.id} className="border border-border p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                to="/comanda/$number"
                params={{ number: o.order_number }}
                className="micro link-underline"
              >
                {o.order_number}
              </Link>
              <span className="text-sm text-muted-foreground">
                {new Date(o.created_at).toLocaleDateString("ro-RO")}
              </span>
              <span className="text-sm">{STATUS_LABEL[o.status] ?? o.status}</span>
              <span className="ml-auto text-sm">{formatRon(Number(o.total))}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {(o.order_items ?? []).map((i, idx) => (
                <li key={idx}>
                  {i.product_name} × {i.quantity} — {formatRon(Number(i.line_total))}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
