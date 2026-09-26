import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useProduct } from "@/lib/products";
import { imageUrl } from "@/lib/images";
import { formatRon } from "@/lib/format";
import { normalizeQty, primaryImage, sortedImages } from "@/lib/shop-types";
import { useCart } from "@/lib/cart";
import { RestockNotice } from "@/components/site/RestockNotice";

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
  const [active, setActive] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [variantError, setVariantError] = useState(false);
  const [qty, setQty] = useState<number | null>(null);
  const [mainFailed, setMainFailed] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [galleryHovered, setGalleryHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const images = useMemo(() => (product ? sortedImages(product) : []), [product]);
  const primaryIndex = product
    ? images.findIndex((image) => image.id === primaryImage(product)?.id)
    : 0;
  const activeIndex = active ?? Math.max(0, primaryIndex);
  const variants = useMemo(
    () => [...(product?.product_variants ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [product],
  );

  useEffect(() => {
    if (!product) return;
    setActive(null);
    setMainFailed(false);
    setAutoRotate(
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches && images.length > 1,
    );
  }, [images, product]);

  useEffect(() => {
    if (!autoRotate || galleryHovered || images.length < 2) return;
    const timer = window.setInterval(() => {
      setMainFailed(false);
      setActive((current) => ((current ?? activeIndex) + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeIndex, autoRotate, galleryHovered, images.length]);

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

  const COLOR_WORDS = [
    "negru",
    "rosu",
    "roșu",
    "verde",
    "albastru",
    "alb",
    "bleo",
    "bleu",
    "mov",
    "roz",
    "bej",
    "portocaliu",
    "galben",
    "gri",
    "maro",
    "auriu",
    "argintiu",
    "transparent",
  ];
  const isColorChoice =
    variants.length > 0 &&
    variants.every((v) =>
      v.name
        .toLowerCase()
        .split(/[\s\u2013\u2014-]+/)
        .some((w) => COLOR_WORDS.includes(w)),
    );
  const optionLabel = isColorChoice ? "Culoare" : "Opțiune";
  const optionPlaceholder = isColorChoice ? "Alege culoarea" : "Alege opțiunea";

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = Number(variant?.price ?? product.price);
  const variantsStocked = variants.some((v) => v.stock > 0);
  const stock = variant && variantsStocked ? variant.stock : product.stock;
  const inStock = !product.track_stock || stock > 0;
  const min = Math.max(1, product.min_order_qty || 1);
  const step = Math.max(1, product.qty_increment || 1);
  const quantity = qty ?? min;
  const perPiece =
    product.units_per_pack && product.units_per_pack > 0
      ? unitPrice / product.units_per_pack
      : null;

  function addToCart() {
    if (!product) return;
    if (variants.length > 0 && !variantId) {
      setVariantError(true);
      return;
    }
    setVariantError(false);
    const safeQty = normalizeQty(product, quantity);
    if (product.track_stock && safeQty > stock) {
      toast.error("Stoc insuficient pentru cantitatea aleasă.");
      return;
    }
    add({ productId: product.id, variantId, qty: safeQty });
    toast.success("Produs adăugat în coș.");
  }

  function selectImage(index: number) {
    setActive((index + images.length) % images.length);
    setMainFailed(false);
    setAutoRotate(false);
  }

  return (
    <div className="site-container py-10">
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
        <div
          onMouseEnter={() => setGalleryHovered(true)}
          onMouseLeave={() => setGalleryHovered(false)}
        >
          <div
            className="product-field"
            onTouchStart={(event) => {
              touchStartX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const start = touchStartX.current;
              const end = event.changedTouches[0]?.clientX;
              touchStartX.current = null;
              if (start === null || end === undefined || Math.abs(end - start) < 45) return;
              selectImage(activeIndex + (end < start ? 1 : -1));
            }}
          >
            {images[activeIndex] && !mainFailed ? (
              <img
                key={images[activeIndex]?.id}
                src={imageUrl(images[activeIndex]?.url) ?? ""}
                alt={images[activeIndex]?.alt ?? product.name}
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
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Fotografia precedentă"
                  onClick={() => selectImage(activeIndex - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 border border-border bg-background/90 px-3 py-2 text-lg shadow-sm transition-opacity hover:opacity-80"
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Fotografia următoare"
                  onClick={() => selectImage(activeIndex + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 border border-border bg-background/90 px-3 py-2 text-lg shadow-sm transition-opacity hover:opacity-80"
                >
                  →
                </button>
              </>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="mt-3">
              <div className="flex flex-wrap gap-3">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => selectImage(i)}
                    aria-label={`Imaginea ${i + 1}${img.is_primary ? ", principală" : ""}`}
                    aria-current={i === activeIndex}
                    className="relative size-20 border bg-field p-2"
                    style={{
                      borderColor: i === activeIndex ? "var(--foreground)" : "var(--border)",
                    }}
                  >
                    <img
                      src={imageUrl(img.url) ?? ""}
                      alt={img.alt ?? product.name}
                      className="size-full object-contain"
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="micro-sm mt-3 link-underline"
                onClick={() => setAutoRotate((current) => !current)}
              >
                {autoRotate ? "Oprește rotirea automată" : "Pornește rotirea automată"}
              </button>
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
            <div className="mt-6">
              <label className="block">
                <span className="micro-sm text-muted-foreground">{optionLabel} *</span>
                <select
                  value={variantId ?? ""}
                  required
                  aria-invalid={variantError}
                  aria-describedby={variantError ? "variant-error" : undefined}
                  onChange={(e) => {
                    setVariantId(e.target.value || null);
                    if (e.target.value) setVariantError(false);
                  }}
                  className="mt-2 w-full border bg-background px-3 py-3 text-sm outline-none focus:border-foreground"
                  style={{ borderColor: variantError ? "var(--destructive)" : "var(--input)" }}
                >
                  <option value="" disabled>
                    {optionPlaceholder}
                  </option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.price !== null ? ` — ${formatRon(v.price)}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {variantError ? (
                <p id="variant-error" role="alert" className="mt-2 text-sm text-destructive">
                  Te rugăm să alegi {isColorChoice ? "o culoare" : "o opțiune"} înainte de a adăuga
                  produsul în coș.
                </p>
              ) : null}
            </div>
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

          {!inStock ? <RestockNotice productId={product.id} variantId={variantId} /> : null}

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
