import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatRon } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { sortedImages, type Product } from "@/lib/shop-types";

function displayPrice(value: number): string {
  return formatRon(value).replace("RON", "lei");
}

function stockLabel(product: Product): string {
  if (!product.track_stock) return "În stoc";
  return product.stock <= 5 ? "Stoc redus" : "În stoc";
}

export function FeaturedProductCard({ product, index }: { product: Product; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [revealed, setRevealed] = useState(false);
  const image = sortedImages(product)[0];
  const source = imageUrl(image?.url);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setRevealed(true);
        observer.unobserve(element);
      },
      { threshold: 0.14 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      ref={cardRef}
      to="/produs/$slug"
      params={{ slug: product.slug }}
      aria-label={`${product.name}, ${displayPrice(product.price)} per ${product.selling_unit}`}
      title={product.name}
      className={`featured-product group flex h-full min-w-0 flex-col outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-background ${revealed ? "is-revealed" : ""}`}
      style={{ "--reveal-delay": `${index * 70}ms` } as CSSProperties}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-field">
        <span className="micro-sm absolute left-2.5 top-2.5 z-10 bg-stock-available px-2 py-1.5 text-stock-available-foreground">
          {stockLabel(product)}
        </span>
        {source ? (
          <img
            src={source}
            alt={image?.alt ?? product.name}
            loading="lazy"
            className="featured-product-image absolute inset-0 size-full object-contain p-4 sm:p-6"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="micro-sm text-muted-foreground">Fără imagine</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col sm:mt-4">
        <p className="micro-sm min-h-3 text-muted-foreground" aria-hidden={!product.categories?.name}>
          {product.categories?.name ?? " "}
        </p>
        <p className="featured-product-name product-title-clamp mt-2 min-h-10 text-sm leading-5">
          {product.name}
        </p>
        <div className="mt-auto pt-3 sm:pt-4">
          {product.units_per_pack && product.units_per_pack > 0 ? (
            <p className="mb-1 text-xs text-muted-foreground">
              {product.units_per_pack} buc./{product.selling_unit}
            </p>
          ) : null}
          <p className="text-sm font-medium leading-6 sm:text-base">
            {displayPrice(product.price)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">/ {product.selling_unit}</span>
          </p>
          <span className="featured-product-link micro-sm mt-2 block min-h-3 text-brand">Vezi produsul</span>
        </div>
      </div>
    </Link>
  );
}