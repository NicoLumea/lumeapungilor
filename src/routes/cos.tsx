import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useCartLines } from "@/lib/use-cart-lines";
import { imageUrl } from "@/lib/images";
import { formatRon } from "@/lib/format";
import { normalizeQty } from "@/lib/shop-types";

export const Route = createFileRoute("/cos")({
  head: () => ({
    meta: [
      { title: "Coș — Lumea Pungilor" },
      { name: "description", content: "Produsele selectate pentru comandă." },
      { property: "og:title", content: "Coș — Lumea Pungilor" },
      { property: "og:description", content: "Produsele selectate pentru comandă." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { setQty, remove } = useCart();
  const { lines, isLoading, subtotal, shipping, shippingConfigured, tax, vatRate, total } =
    useCartLines();

  return (
    <div className="site-container max-w-[1200px] py-14">
      <h1 className="display text-3xl md:text-4xl">Coș</h1>

      {isLoading ? (
        <p className="py-20 text-sm text-muted-foreground">Se încarcă…</p>
      ) : lines.length === 0 ? (
        <div className="py-24">
          <p className="text-sm text-muted-foreground">Coșul este gol.</p>
          <Link to="/produse" className="micro mt-6 inline-block link-underline">
            Vezi catalogul
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <ul className="divide-y divide-border border-y border-border">
            {lines.map((l) => {
              const img = imageUrl(l.imageUrlPath);
              const min = Math.max(1, l.product.min_order_qty || 1);
              const step = Math.max(1, l.product.qty_increment || 1);
              return (
                <li key={`${l.product.id}-${l.variant?.id ?? "std"}`} className="flex gap-5 py-6">
                  <div className="size-28 shrink-0 bg-field p-2">
                    {img ? (
                      <img src={img} alt={l.product.name} className="size-full object-contain" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <Link
                      to="/produs/$slug"
                      params={{ slug: l.product.slug }}
                      className="text-sm link-underline"
                    >
                      {l.product.name}
                    </Link>
                    {l.variant ? (
                      <p className="micro-sm mt-1 text-muted-foreground">{l.variant.name}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatRon(l.unitPrice)} / {l.product.selling_unit}
                      {l.product.units_per_pack
                        ? ` · ${l.product.units_per_pack} buc. per ${l.product.selling_unit}`
                        : ""}
                    </p>

                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex w-fit items-center border border-input">
                        <button
                          type="button"
                          aria-label="Scade cantitatea"
                          className="px-3 py-2 text-sm"
                          onClick={() =>
                            setQty(l.product.id, l.variant?.id ?? null, Math.max(min, l.qty - step))
                          }
                        >
                          −
                        </button>
                        <input
                          aria-label="Cantitate"
                          value={l.qty}
                          inputMode="numeric"
                          onChange={(e) =>
                            setQty(
                              l.product.id,
                              l.variant?.id ?? null,
                              Number(e.target.value.replace(/\D/g, "")) || min,
                            )
                          }
                          onBlur={() =>
                            setQty(
                              l.product.id,
                              l.variant?.id ?? null,
                              normalizeQty(l.product, l.qty),
                            )
                          }
                          className="w-14 border-x border-input bg-background py-2 text-center text-sm outline-none"
                        />
                        <button
                          type="button"
                          aria-label="Crește cantitatea"
                          className="px-3 py-2 text-sm"
                          onClick={() => setQty(l.product.id, l.variant?.id ?? null, l.qty + step)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="micro-sm link-underline"
                        onClick={() => remove(l.product.id, l.variant?.id ?? null)}
                      >
                        Elimină
                      </button>
                    </div>

                    {l.product.track_stock && l.qty > l.stock ? (
                      <p className="mt-2 text-sm text-destructive">
                        Stoc disponibil: {l.stock}. Redu cantitatea pentru a finaliza comanda.
                      </p>
                    ) : null}
                    {l.qty !== normalizeQty(l.product, l.qty) ? (
                      <p className="mt-2 text-sm text-destructive">
                        Cantitatea trebuie să pornească de la {min} și să crească din {step} în {step}.
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm">{formatRon(l.lineTotal)}</p>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit border border-border p-6">
            <p className="micro-sm text-muted-foreground">Sumar</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatRon(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Livrare</dt>
                <dd>{shippingConfigured ? formatRon(shipping) : "Se calculează după confirmare"}</dd>
              </div>
              {vatRate !== null ? (
                <div className="flex justify-between">
                  <dt>TVA ({vatRate}%)</dt>
                  <dd>{formatRon(tax)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt>Total</dt>
                <dd>{formatRon(total)}</dd>
              </div>
            </dl>
            <Link
              to="/checkout"
              className="micro mt-8 block border border-foreground bg-foreground px-8 py-4 text-center text-background transition-opacity hover:opacity-85"
            >
              Finalizează comanda
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
