import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { imageUrl } from "@/lib/images";
import { formatRon } from "@/lib/format";
import { sortedImages, type Product } from "@/lib/shop-types";

export function ProductCard({ product }: { product: Product }) {
  const images = sortedImages(product);
  const primary = imageUrl(images[0]?.url);
  const secondary = imageUrl(images[1]?.url);
  const [hover, setHover] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <Link
      to="/produs/$slug"
      params={{ slug: product.slug }}
      className="group block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="product-field">
        {primary && !failed ? (
          <>
            <img
              src={primary}
              alt={images[0]?.alt ?? product.name}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className="absolute inset-0 size-full object-contain p-6 transition-opacity duration-300"
              style={{ opacity: loaded ? (hover && secondary ? 0 : 1) : 0 }}
            />
            {secondary ? (
              <img
                src={secondary}
                alt={images[1]?.alt ?? product.name}
                loading="lazy"
                className="absolute inset-0 size-full object-contain p-6 transition-opacity duration-300"
                style={{ opacity: hover ? 1 : 0 }}
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

      <div className="mt-3 space-y-1">
        {product.categories?.name ? (
          <p className="micro-sm text-muted-foreground">{product.categories.name}</p>
        ) : null}
        <p className="text-sm">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatRon(product.price)}
          <span className="micro-sm ml-1">/ {product.selling_unit}</span>
        </p>
      </div>
    </Link>
  );
}
