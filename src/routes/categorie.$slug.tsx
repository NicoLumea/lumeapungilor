import { createFileRoute } from "@tanstack/react-router";
import { Catalogue } from "@/components/site/Catalogue";
import { useCategories } from "@/lib/content";

export const Route = createFileRoute("/categorie/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Categorie ${params.slug} — Lumea Pungilor` },
      { name: "description", content: "Produse de ambalare din această categorie." },
      { property: "og:title", content: `Categorie ${params.slug} — Lumea Pungilor` },
      { property: "og:description", content: "Produse de ambalare din această categorie." },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: categories } = useCategories();
  const category = (categories ?? []).find((c) => c.slug === slug);

  return (
    <Catalogue
      categorySlug={slug}
      title={category?.name ?? "Categorie"}
      intro={category?.description ?? null}
    />
  );
}
