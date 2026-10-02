import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/components/site/Catalogue";
import { getSeoCatalog } from "@/lib/seo-catalog.functions";
import { absolutePublicUrl } from "@/lib/product-seo";

export const Route = createFileRoute("/produse")({
  loader: () => getSeoCatalog(),
  head: () => ({
    meta: [
      { title: "Catalog produse — Lumea Pungilor" },
      {
        name: "description",
        content: "Toate ambalajele disponibile: pungi, fețe de masă și folie cu bule.",
      },
      { property: "og:title", content: "Catalog produse — Lumea Pungilor" },
      { property: "og:description", content: "Toate ambalajele disponibile pentru comandă." },
    ],
    links: [{ rel: "canonical", href: absolutePublicUrl("/produse") }],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const initial = Route.useLoaderData();
  return (
    <Catalogue
      title="Toate produsele"
      initialProducts={initial.products}
      initialCategories={initial.categories}
    />
  );
}
