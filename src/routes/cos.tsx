import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useCartLines } from "@/lib/use-cart-lines";
import { imageUrl } from "@/lib/images";
import { formatRon } from "@/lib/format";
import { normalizeQty } from "@/lib/shop-types";
import { toast } from "sonner";

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
  const { setQty, remove, clear } = useCart();
  const {
    lines,
    invalidItems,
    hasStockError,
    hasQuantityError,
    isError,
    isLoading,
    subtotal,
    shipping,
    shippingConfigured,
    tax,
    vatRate,
    pricesIncludeVat,
    total,
    configurationReady,
  } = useCartLines();

  function changeQty(
    productId: string,
    variantId: string | null,
    qty: number,
    stock: number,
    trackStock: boolean,
  ) {
    if (!Number.isSafeInteger(qty) || qty < 1 || qty > 100000) {
      toast.error("Introdu o cantitate validă de seturi.");
      return;
    }
    if (trackStock && qty > stock) {
      toast.error(`Sunt disponibile maximum ${stock} seturi.`);
      return;
    }
    setQty(productId, variantId, qty);
  }

  return (
    <div className="site-container max-w-[1200px] py-14">
      <h1 className="display text-3xl md:text-4xl">Coș</h1>

      {isLoading ? (
        <p className="py-20 text-sm text-muted-foreground">Se încarcă…</p>
      ) : isError ? (
        <p role="alert" className="py-20 text-sm text-destructive">
          Coșul nu a putut fi verificat. Reîncarcă pagina.
        </p>
      ) : lines.length === 0 && invalidItems.length === 0 ? (
        <div className="py-24">
          <p className="text-sm text-muted-foreground">Coșul este gol.</p>
          <Link to="/produse" className="micro mt-6 inline-block link-underline">
            Vezi catalogul
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <ul className="divide-y divide-border border-y border-border">
            {invalidItems.map((item) => (
              <li
                key={`${item.productId}-${item.variantId ?? "std"}`}
                className="flex flex-wrap items-center justify-between gap-4 py-6"
                role="alert"
              >
                <p className="text-sm text-destructive">{item.message}</p>
                <button
                  type="button"
                  className="micro-sm link-underline"
                  onClick={() => remove(item.productId, item.variantId)}
                >
                  Elimină din coș
                </button>
              </li>
            ))}
            {lines.map((l) => {
              const img = imageUrl(l.imageUrlPath);
              const min = Math.max(1, l.product.min_order_qty || 1);
              const step = Math.max(1, l.product.qty_increment || 1);
              return (
                <li
                  key={`${l.product.id}-${l.variant?.id ?? "std"}`}
                  className="flex min-w-0 flex-wrap gap-5 py-6 sm:flex-nowrap"
                >
                  <div className="size-28 shrink-0 bg-field p-2">
                    {img ? (
                      <img src={img} alt={l.product.name} className="size-full object-contain" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/produs/$slug"
                      params={{ slug: l.product.slug }}
                      className="break-words text-sm link-underline"
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
                            changeQty(
                              l.product.id,
                              l.variant?.id ?? null,
                              Math.max(min, l.qty - step),
                              l.stock,
                              l.product.track_stock,
                            )
                          }
                        >
                          −
                        </button>
                        <input
                          aria-label="Cantitate"
                          value={l.qty}
                          inputMode="numeric"
                          onChange={(e) =>
                            changeQty(
                              l.product.id,
                              l.variant?.id ?? null,
                              Number(e.target.value.replace(/\D/g, "")) || min,
                              l.stock,
                              l.product.track_stock,
                            )
                          }
                          onBlur={() =>
                            changeQty(
                              l.product.id,
                              l.variant?.id ?? null,
                              normalizeQty(l.product, l.qty),
                              l.stock,
                              l.product.track_stock,
                            )
                          }
                          className="w-14 border-x border-input bg-background py-2 text-center text-sm outline-none"
                        />
                        <button
                          type="button"
                          aria-label="Crește cantitatea"
                          className="px-3 py-2 text-sm"
                          onClick={() =>
                            changeQty(
                              l.product.id,
                              l.variant?.id ?? null,
                              l.qty + step,
                              l.stock,
                              l.product.track_stock,
                            )
                          }
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
                        Cantitatea trebuie să pornească de la {min} și să crească din {step} în{" "}
                        {step}.
                      </p>
                    ) : null}
                  </div>
                  <p className="ml-auto text-sm">{formatRon(l.lineTotal)}</p>
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
                <dd>
                  {shippingConfigured ? formatRon(shipping) : "Se calculează după confirmare"}
                </dd>
              </div>
              {vatRate !== null && configurationReady ? (
                <div className="flex justify-between">
                  <dt>
                    TVA ({vatRate}%{pricesIncludeVat ? ", inclus" : ""})
                  </dt>
                  <dd>{formatRon(tax)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt>Total</dt>
                <dd>{configurationReady ? formatRon(total) : "Se confirmă după configurare"}</dd>
              </div>
            </dl>
            {!configurationReady ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                Livrarea și TVA trebuie configurate înainte de finalizarea comenzii.
              </p>
            ) : null}
            {invalidItems.length > 0 || hasStockError || hasQuantityError || !configurationReady ? (
              <p className="micro mt-8 border border-border px-8 py-4 text-center text-muted-foreground">
                Verifică produsele și totalul înainte de finalizare
              </p>
            ) : (
              <Link
                to="/checkout"
                className="micro mt-8 block border border-foreground bg-foreground px-8 py-4 text-center text-background transition-opacity hover:opacity-85"
              >
                Continuă către finalizarea comenzii
              </Link>
            )}
            <button
              type="button"
              className="micro-sm mt-5 link-underline"
              onClick={() => {
                if (window.confirm("Golești coșul?")) clear();
              }}
            >
              Golește coșul
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
