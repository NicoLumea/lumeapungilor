import { imageUrl } from "./images.ts";
import {
  assignedCategories,
  primaryImage,
  productAvailableStock,
  type Product,
} from "./shop-types.ts";
import { categoryRouteSlug, SITEMAP_ORIGIN } from "./sitemap.ts";

export function absolutePublicUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, `${SITEMAP_ORIGIN}/`).toString();
}

export function productCanonical(product: Pick<Product, "slug">): string {
  return absolutePublicUrl(`/produs/${encodeURIComponent(product.slug)}`);
}

export function categoryCanonical(slug: string): string {
  return absolutePublicUrl(`/categorie/${encodeURIComponent(categoryRouteSlug(slug))}`);
}

export function factualProductDescription(product: Product): string {
  const explicit = product.description?.trim();
  if (explicit) return explicit.slice(0, 320);
  const facts = product.specs
    .filter((spec) => spec.label.trim() && spec.value.trim())
    .slice(0, 4)
    .map((spec) => `${spec.label.trim()}: ${spec.value.trim()}`);
  return [product.name, ...facts].join(". ").slice(0, 320);
}

export function productImageAlt(product: Product): string {
  return primaryImage(product)?.alt?.trim() || product.name;
}

export function productJsonLd(product: Product): Record<string, unknown> {
  const canonical = productCanonical(product);
  const storedImage = imageUrl(primaryImage(product)?.url);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: factualProductDescription(product),
    url: canonical,
  };
  if (storedImage) schema["image"] = [absolutePublicUrl(storedImage)];
  if (product.sku?.trim()) schema["sku"] = product.sku.trim();
  if (Number.isFinite(Number(product.price))) {
    schema["offers"] = {
      "@type": "Offer",
      url: canonical,
      price: Number(product.price).toFixed(2),
      priceCurrency: product.currency || "RON",
      availability:
        !product.track_stock || productAvailableStock(product) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    };
  }
  return schema;
}

export function productBreadcrumbJsonLd(product: Product): Record<string, unknown> {
  const primary = assignedCategories(product)[0];
  const items: Record<string, unknown>[] = [
    { "@type": "ListItem", position: 1, name: "Magazin", item: absolutePublicUrl("/magazin") },
    { "@type": "ListItem", position: 2, name: "Produse", item: absolutePublicUrl("/produse") },
  ];
  if (primary) {
    items.push({
      "@type": "ListItem",
      position: 3,
      name: primary.name,
      item: categoryCanonical(primary.slug),
    });
  }
  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: product.name,
    item: productCanonical(product),
  });
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

export function jsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
