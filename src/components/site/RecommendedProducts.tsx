import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ProductCard } from "@/components/site/ProductCard";
import { usePublishedProducts } from "@/lib/products";
import { getTopSellingProducts } from "@/lib/recommendations.functions";

export function RecommendedProducts({ concise = false }: { concise?: boolean }) {
  const { data: products } = usePublishedProducts();
  const topSelling = useServerFn(getTopSellingProducts);
  const { data: sales } = useQuery({
    queryKey: ["recommendations", "top-selling"],
    queryFn: () => topSelling(),
    staleTime: 5 * 60 * 1000,
  });
  const availableProducts = (products ?? []).filter(
    (product) => !product.track_stock || product.stock > 0,
  );
  const salesRanked = (sales?.productIds ?? [])
    .map((id) => availableProducts.find((product) => product.id === id))
    .filter((product): product is NonNullable<typeof product> => !!product);
  const useSales = !!sales?.fromSales && salesRanked.length > 0;
  const preferred = useSales
    ? salesRanked
    : availableProducts.filter((product) => product.is_featured);
  const preferredIds = new Set(preferred.map((product) => product.id));
  const recommended = [
    ...preferred,
    ...availableProducts.filter((product) => !preferredIds.has(product.id)),
  ].slice(0, 5);
  const heading = useSales ? "Cele mai cumpărate" : "Produse recomandate";

  if (recommended.length === 0) return null;

  return (
    <section className="rule-t">
      <div className={`catalogue-container ${concise ? "py-10 md:py-14" : "py-10 md:py-20"}`}>
        <div className="max-w-2xl">
          <h2 className="display text-3xl md:text-4xl">{heading}</h2>
          {!concise ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {useSales
                ? "Produse alese cel mai des de clienții noștri, disponibile acum în stoc."
                : "Produse disponibile, selectate din catalog."}
            </p>
          ) : null}
        </div>
        <div className="product-grid mt-7 md:mt-10">
          {recommended.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
