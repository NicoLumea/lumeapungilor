import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { Catalogue } from "@/components/site/Catalogue";
import { getSeoCategory } from "@/lib/seo-catalog.functions";
import { categoryCanonical } from "@/lib/product-seo";

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
  loader: async ({ params }) => {
    const result = await getSeoCategory({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: `${loaderData?.category.name ?? params.slug} | Lumea Pungilor` },
      {
        name: "description",
        content:
          loaderData?.category.description?.trim() ||
          `Produse publicate în categoria ${loaderData?.category.name ?? params.slug}.`,
      },
      {
        property: "og:title",
        content: `${loaderData?.category.name ?? params.slug} | Lumea Pungilor`,
      },
      {
        property: "og:description",
        content:
          loaderData?.category.description?.trim() ||
          `Produse publicate în categoria ${loaderData?.category.name ?? params.slug}.`,
      },
    ],
    links: [{ rel: "canonical", href: categoryCanonical(params.slug) }],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const initial = Route.useLoaderData();
  return (
    <Catalogue
      key={slug}
      categorySlug={slug}
      title={initial.category.name}
      intro={initial.category.description}
      initialCategory={initial.category}
      initialCategories={initial.categories}
      initialProducts={initial.products}
    />
  );
}
