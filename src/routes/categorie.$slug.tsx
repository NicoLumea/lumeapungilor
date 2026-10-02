import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { Catalogue } from "@/components/site/Catalogue";
import { getSeoCategory } from "@/lib/seo-catalog.functions";
import { getSeoRedirect } from "@/lib/seo-catalog.functions";
import { categoryBreadcrumbJsonLd, categoryCanonical, jsonLd } from "@/lib/product-seo";
import { descriptionExcerpt } from "@/lib/safe-markdown";
import { socialImageUrl } from "@/lib/seo-meta";

/** Permanent slug changes: old catalog URLs must keep working. */
const SLUG_REDIRECTS: Record<string, string> = {
  "pungi-hartie": "pungi-fara-maner",
};

export const Route = createFileRoute("/categorie/$slug")({
  beforeLoad: async ({ params, location }) => {
    const target = SLUG_REDIRECTS[params.slug];
    if (target) {
      throw redirect({
        href: `/categorie/${target}${location.searchStr}`,
        replace: true,
        statusCode: 301,
      });
    }
    const stored = await getSeoRedirect({ data: { path: `/categorie/${params.slug}` } });
    if (stored) throw redirect({ href: `${stored}${location.searchStr}`, statusCode: 301 });
  },
  loader: async ({ params }) => {
    const result = await getSeoCategory({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData, params }) => {
    const category = loaderData?.category;
    const name = category?.name ?? params.slug;
    const title = category?.meta_title?.trim() || `${name} — Lumea Pungilor`;
    const description =
      category?.meta_description?.trim() ||
      descriptionExcerpt(category?.intro_text || category?.description) ||
      name;
    const canonical = categoryCanonical(category?.slug ?? params.slug);
    const shareImage = socialImageUrl(category?.image_url);
    return {
      meta: [
        { title },
        {
          name: "description",
          content: description,
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
        ...(shareImage ? [{ property: "og:image", content: shareImage }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        ...(shareImage ? [{ name: "twitter:image", content: shareImage }] : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const initial = Route.useLoaderData();
  return (
    <>
      <script type="application/ld+json">
        {jsonLd(categoryBreadcrumbJsonLd(initial.category))}
      </script>
      <Catalogue
        key={slug}
        categorySlug={slug}
        title={initial.category.name}
        intro={initial.category.intro_text || initial.category.description}
        initialCategory={initial.category}
        initialCategories={initial.categories}
        initialProducts={initial.products}
      />
    </>
  );
}
