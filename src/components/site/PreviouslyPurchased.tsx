import { useMemo } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { useMyOrders } from "@/lib/dashboard-data";
import { recentPurchasedProductIds } from "@/lib/order-experience";
import { usePublishedProducts } from "@/lib/products";
import { useAuth } from "@/lib/use-auth";
import { productAvailableStock } from "@/lib/shop-types";

export function PreviouslyPurchased() {
  const auth = useAuth();
  const orders = useMyOrders(auth.user?.id, !!auth.user);
  const products = usePublishedProducts();
  const purchased = useMemo(() => {
    const ids = recentPurchasedProductIds(orders.data ?? [], 20);
    const byId = new Map((products.data ?? []).map((product) => [product.id, product]));
    return ids
      .map((id) => byId.get(id))
      .filter(
        (product): product is NonNullable<typeof product> =>
          !!product && (!product.track_stock || productAvailableStock(product) > 0),
      )
      .slice(0, 5);
  }, [orders.data, products.data]);

  if (!auth.user || purchased.length === 0) return null;
  return (
    <section className="rule-t">
      <div className="catalogue-container py-10 md:py-20">
        <h2 className="display text-3xl md:text-4xl">Cumpărate anterior</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Produse din comenzile tale, disponibile acum pentru o nouă comandă.
        </p>
        <div className="product-grid mt-7 md:mt-10">
          {purchased.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
