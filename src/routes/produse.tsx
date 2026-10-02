import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/components/site/Catalogue";
import { getSeoCatalog } from "@/lib/seo-catalog.functions";
import { staticPageHead } from "@/lib/seo-meta";

export const Route = createFileRoute("/produse")({
  loader: () => getSeoCatalog(),
  head: () =>
    staticPageHead({
      block: undefined,
      h1: "Toate produsele",
      body: "Catalogul complet de produse publicate de Lumea Pungilor.",
      path: "/produse",
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
