import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { imageUrl } from "@/lib/images";
import { formatRon } from "@/lib/format";
import { sortedImages, type Product } from "@/lib/shop-types";
import { cn } from "@/lib/utils";

type StockState = "available" | "low" | "unavailable";

function stockState(product: Product): StockState {
  if (!product.track_stock) return "available";
  if (product.stock <= 0) return "unavailable";
  return product.stock <= 5 ? "low" : "available";
}

function cataloguePrice(value: number): string {
  return formatRon(value).replace("RON", "lei");
}

export function ProductCard({ product }: { product: Product }) {
  const images = sortedImages(product);
  const primary = imageUrl(images[0]?.url);
  const secondary = imageUrl(images[1]?.url);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const inventory = stockState(product);
  const stockLabel =
    inventory === "unavailable" ? "Stoc epuizat" : inventory === "low" ? "Stoc redus" : "În stoc";

  return (
    <Link
      to="/produs/$slug"
      params={{ slug: product.slug }}
      aria-label={`${product.name}, ${cataloguePrice(product.price)} per ${product.selling_unit}`}
      title={product.name}
      className="product-card group flex h-full min-w-0 max-w-[20rem] flex-col justify-self-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative h-[10.75rem] w-full overflow-hidden bg-field min-[480px]:h-[12rem] md:h-[13rem] lg:h-[14.5rem] xl:h-[15rem] min-[1600px]:h-[15.5rem]">
        <span
          className={cn(
            "micro-sm absolute left-2 top-2 z-10 px-2 py-1.5",
            inventory === "available" && "bg-stock-available text-stock-available-foreground",
            inventory === "low" && "bg-stock-low text-stock-low-foreground",
            inventory === "unavailable" && "bg-stock-unavailable text-stock-unavailable-foreground",
          )}
        >
          {stockLabel}
        </span>
        {primary && !failed ? (
          <>
            <img
              src={primary}
              alt={images[0]?.alt ?? product.name}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={cn(
                "product-card-image absolute inset-0 size-full object-contain p-3 sm:p-4",
                loaded ? "opacity-100" : "opacity-0",
                secondary && "group-hover:opacity-0",
              )}
            />
            {secondary ? (
              <img
                src={secondary}
                alt={images[1]?.alt ?? product.name}
                loading="lazy"
                className="product-card-image absolute inset-0 size-full object-contain p-3 opacity-0 group-hover:opacity-100 sm:p-4"
              />
            ) : null}
          </>
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="micro-sm text-muted-foreground">
              {failed ? "Imaginea nu s-a încărcat" : "Fără imagine"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="micro-sm min-h-3 text-muted-foreground" aria-hidden={!product.categories?.name}>
          {product.categories?.name ?? " "}
        </p>
        <p className="product-title-clamp mt-1.5 min-h-9 text-[0.8125rem] leading-[1.125rem] sm:text-sm sm:leading-5">{product.name}</p>
        <div className="mt-auto pt-2.5">
          {product.units_per_pack && product.units_per_pack > 0 ? (
            <p className="mb-1 text-[0.6875rem] text-muted-foreground sm:text-xs">
              {product.units_per_pack} buc./{product.selling_unit}
            </p>
          ) : null}
          <p className="text-sm font-medium leading-5 sm:text-base sm:leading-6">
            {cataloguePrice(product.price)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">/ {product.selling_unit}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
