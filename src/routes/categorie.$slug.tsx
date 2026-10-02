import { createFileRoute, redirect } from "@tanstack/react-router";
import { Catalogue } from "@/components/site/Catalogue";

/** Permanent slug changes: old catalog URLs must keep working. */
const SLUG_REDIRECTS: Record<string, string> = {
  "pungi-hartie": "pungi-fara-maner",
};

export const Route = createFileRoute("/categorie/$slug")({
  beforeLoad: ({ params }) => {
    const target = SLUG_REDIRECTS[params.slug];
    if (target) {
      throw redirect({ to: "/categorie/$slug", params: { slug: target }, replace: true });
    }
  },
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
  return <Catalogue key={slug} categorySlug={slug} title="Categorie" />;
}
