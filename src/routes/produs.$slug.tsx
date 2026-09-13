import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useProduct } from "@/lib/products";
import { imageUrl } from "@/lib/images";
import { formatRon } from "@/lib/format";
import { normalizeQty, sortedImages } from "@/lib/shop-types";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/produs/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Lumea Pungilor` },
      { name: "description", content: "Detalii produs, specificații și preț." },
      { property: "og:title", content: `${params.slug} — Lumea Pungilor` },
      { property: "og:description", content: "Detalii produs, specificații și preț." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { add } = useCart();
  const [active, setActive] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState<number | null>(null);
  const [mainFailed, setMainFailed] = useState(false);

  const images = useMemo(() => (product ? sortedImages(product) : []), [product]);
  const variants = useMemo(
    () => [...(product?.product_variants ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [product],
  );

  if (isLoading) {
    return <p className="py-32 text-center text-sm text-muted-foreground">Se încarcă…</p>;
  }

  if (!product) {
    return (
      <div className="py-32 text-center">
        <p className="text-sm text-muted-foreground">Produsul nu a fost găsit.</p>
        <Link to="/produse" className="micro mt-6 inline-block link-underline">
          Înapoi la catalog
        </Link>
      </div>
    );
  }

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = Number(variant?.price ?? product.price);
  const stock = variant ? variant.stock : product.stock;
  const inStock = !product.track_stock || stock > 0;
  const min = Math.max(1, product.min_order_qty || 1);
  const step = Math.max(1, product.qty_increment || 1);
  const quantity = qty ?? min;
  const perPiece =
    product.units_per_pack && product.units_per_pack > 0 ? unitPrice / product.units_per_pack : null;

  function addToCart() {
    if (!product) return;
    const safeQty = normalizeQty(product, quantity);
    if (product.track_stock && safeQty > stock) {
      toast.error("Stoc insuficient pentru cantitatea aleasă.");
      return;
    }
    add({ productId: product.id, variantId, qty: safeQty });
    toast.success("Produs adăugat în coș.");
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8">
      <nav className="micro-sm text-muted-foreground">
        <Link to="/produse" className="link-underline">
          Catalog
        </Link>
        {product.categories ? (
          <>
            {" / "}
            <Link
              to="/categorie/$slug"
              params={{ slug: product.categories.slug }}
              className="link-underline"
            >
              {product.categories.name}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="product-field">
            {images[active] && !mainFailed ? (
              <img
                key={images[active]?.id}
                src={imageUrl(images[active]?.url) ?? ""}
                alt={images[active]?.alt ?? product.name}
                onError={() => setMainFailed(true)}
                className="absolute inset-0 size-full object-contain p-10"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="micro-sm text-muted-foreground">
                  {mainFailed ? "Imaginea nu s-a încărcat" : "Fără imagine"}
                </span>
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => { setActive(i); setMainFailed(false); }}
                  aria-label={`Imaginea ${i + 1}`}
                  aria-current={i === active}
                  className="size-20 border bg-field p-2"
                  style={{ borderColor: i === active ? "var(--foreground)" : "var(--border)" }}
                >
                  <img
                    src={imageUrl(img.url) ?? ""}
                    alt={img.alt ?? product.name}
                    className="size-full object-contain"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.categories ? (
            <p className="micro-sm text-muted-foreground">{product.categories.name}</p>
          ) : null}
          <h1 className="display mt-2 text-2xl md:text-3xl">{product.name}</h1>

          <div className="mt-5">
            <p className="text-lg">
              {formatRon(unitPrice)} <span className="micro-sm">/ {product.selling_unit}</span>
            </p>
            {perPiece ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Informativ: {formatRon(perPiece)} / bucată · {product.units_per_pack} buc. per{" "}
                {product.selling_unit}
              </p>
            ) : null}
          </div>

          <p className="micro-sm mt-4 text-muted-foreground">
            {inStock ? "În stoc" : "Stoc epuizat"}
            {product.sku ? ` · Cod ${product.sku}` : ""}
          </p>

          {variants.length > 0 ? (
            <label className="mt-6 block">
              <span className="micro-sm text-muted-foreground">Opțiune</span>
              <select
                value={variantId ?? ""}
                onChange={(e) => setVariantId(e.target.value || null)}
                className="mt-2 w-full border border-input bg-background px-3 py-3 text-sm outline-none focus:border-foreground"
              >
                <option value="">Standard</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.price !== null ? ` — ${formatRon(v.price)}` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="mt-6">
            <span className="micro-sm text-muted-foreground">
              Cantitate ({product.selling_unit}, minim {min}, pas {step})
            </span>
            <div className="mt-2 flex w-fit items-center border border-input">
              <button
                type="button"
                aria-label="Scade cantitatea"
                className="px-4 py-3 text-sm"
                onClick={() => setQty(Math.max(min, quantity - step))}
              >
                −
              </button>
              <input
                aria-label="Cantitate"
                value={quantity}
                inputMode="numeric"
                onChange={(e) => setQty(Number(e.target.value.replace(/\D/g, "")) || min)}
                onBlur={() => setQty(normalizeQty(product, quantity))}
                className="w-16 border-x border-input bg-background py-3 text-center text-sm outline-none"
              />
              <button
                type="button"
                aria-label="Crește cantitatea"
                className="px-4 py-3 text-sm"
                onClick={() => setQty(quantity + step)}
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={!inStock}
            className="micro mt-6 w-full border border-foreground bg-foreground px-8 py-4 text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {inStock ? "Adaugă în coș" : "Indisponibil"}
          </button>

          {product.description ? (
            <div className="mt-10 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </div>
          ) : null}

          {product.specs.length > 0 ? (
            <div className="mt-10">
              <p className="micro-sm text-muted-foreground">Specificații</p>
              <dl className="mt-4 divide-y divide-border border-y border-border">
                {product.specs.map((s, i) => (
                  <div key={i} className="flex justify-between gap-6 py-3 text-sm">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="text-right">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
