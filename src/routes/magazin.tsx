import { HeadingText } from "@/components/site/HeadingText";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RecommendedProducts } from "@/components/site/RecommendedProducts";
import { PreviouslyPurchased } from "@/components/site/PreviouslyPurchased";
import { StoreHero } from "@/components/site/StoreHero";
import { useCategories, useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";
import { imageVariantSrcSet, imageVariantUrl } from "@/lib/image-variants";
import { companyInfo, telephoneHref } from "@/lib/company";
import { getSeoCatalog } from "@/lib/seo-catalog.functions";
import { getSeoContent } from "@/lib/seo-catalog.functions";
import { categoryRouteSlug } from "@/lib/sitemap";
import { staticPageHead } from "@/lib/seo-meta";
import { SafeMarkdown } from "@/lib/safe-markdown";

export const Route = createFileRoute("/magazin")({
  loader: async () => {
    const [catalog, home] = await Promise.all([
      getSeoCatalog(),
      getSeoContent({ data: { key: "home" } }),
    ]);
    return { ...catalog, home };
  },
  head: ({ loaderData }) => {
    const home = loaderData?.home;
    const h1 = text(home, "hero_title") ?? "Lumea Pungilor";
    return staticPageHead({
      block: home,
      h1,
      body: text(home, "hero_text") ?? text(home, "hero_subtitle"),
      path: "/magazin",
      image: text(home, "hero_image_url"),
    });
  },
  component: Shop,
});

function Shop() {
  const initial = Route.useLoaderData();
  const { data: content } = useContent();
  const { data: liveCategories } = useCategories();
  const categories = liveCategories ?? initial.categories;
  const home = content?.["home"] ?? initial.home;
  const company = companyInfo(content);
  const edTitle = text(home, "editorial_title");
  const edBody = text(home, "editorial_text") ?? text(home, "editorial_body");
  const edImage = imageUrl(text(home, "editorial_image_url"));

  return (
    <div>
      <StoreHero home={initial.home} />

      <section className="border-b border-border">
        <ul className="site-container grid gap-3 py-5 text-sm sm:grid-cols-3">
          <li className="text-muted-foreground">Comenzi pentru persoane fizice și firme</li>
          <li className="text-muted-foreground">
            Asistență:{" "}
            <a
              href={telephoneHref(company.phonePrimary)}
              className="link-underline text-foreground"
            >
              {company.phonePrimary}
            </a>
          </li>
          <li className="text-muted-foreground">
            {company.operatingDays
              ? `${company.operatingDays} ${company.operatingHours ?? ""}`.trim()
              : "Program de lucru afișat la Contact"}
          </li>
        </ul>
      </section>

      {(categories ?? []).length > 0 ? (
        <section className="site-container py-8 md:py-20">
          <p className="micro-sm text-muted-foreground">Categorii</p>
          <div className="mt-5 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 md:mt-8 md:gap-x-[clamp(16px,2vw,32px)] md:gap-y-10 lg:grid-cols-4">
            {(categories ?? []).map((c) => {
              const img = imageUrl(c.image_url);
              return (
                <Link
                  key={c.id}
                  to="/categorie/$slug"
                  preload="intent"
                  preloadDelay={80}
                  params={{ slug: categoryRouteSlug(c.slug) }}
                  className="category-card group block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  <div className="category-card-media relative aspect-[4/5] overflow-hidden bg-field md:aspect-[3/4]">
                    {img ? (
                      <img
                        src={imageVariantUrl(c.image_url, 640) ?? img}
                        srcSet={imageVariantSrcSet(c.image_url, [320, 640])}
                        sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                        alt={c.name}
                        loading="lazy"
                        decoding="async"
                        className="category-card-image absolute inset-0 size-full object-contain p-3 sm:p-6"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <span className="micro-sm text-muted-foreground">{c.name}</span>
                      </div>
                    )}
                    <span className="category-card-overlay absolute inset-0" aria-hidden="true" />
                  </div>
                  <div className="category-card-label mt-2 min-h-8 text-center sm:mt-3 sm:text-left">
                    <h3 className="line-clamp-2 inline text-xs font-medium uppercase leading-4 sm:text-[0.6875rem] sm:leading-[1.2]">
                      {c.name}
                    </h3>
                  </div>
                  {c.description ? (
                    <p className="mt-1 hidden text-sm text-muted-foreground md:block">
                      {c.description}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rule-t">
        <div className="site-container grid gap-6 py-10 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:items-start md:gap-12 md:py-14">
          <h2 className="display text-3xl md:text-4xl">
            {text(home, "magazin_about_title") ?? <HeadingText id="magazin_about_h2" />}
          </h2>
          <div>
            <SafeMarkdown
              className="max-w-3xl text-sm text-muted-foreground md:text-base"
              children={
                text(home, "magazin_about_body") ??
                "Lumea Pungilor reunește într-un singur catalog produse practice pentru ambalare, servire și protejarea mărfurilor. Oferta include pungi cu mâner, pungi fără mâner, fețe de masă și folie cu bule pentru magazine, revânzători, restaurante, ateliere și alte activități profesionale."
              }
            />
            <Link
              to="/despre"
              className="micro mt-6 inline-flex min-h-11 w-fit items-center border border-foreground px-5 py-2.5 transition-colors active:bg-foreground active:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground hover:bg-foreground hover:text-background"
            >
              Află mai multe despre noi
            </Link>
          </div>
        </div>
      </section>

      <RecommendedProducts initialProducts={initial.products} />
      <PreviouslyPurchased />

      {edTitle || edBody || edImage ? (
        <section className="rule-t">
          <div className="site-container grid items-center gap-8 py-8 md:grid-cols-2 md:gap-12 md:py-24">
            <div>
              {edTitle ? <h2 className="display text-3xl md:text-5xl">{edTitle}</h2> : null}
              {edBody ? (
                <p className="mt-6 max-w-md whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                  {edBody}
                </p>
              ) : null}
              <Link
                to="/produse"
                className="micro mt-7 inline-flex min-h-11 w-fit max-w-full items-center border border-foreground px-5 py-2.5 transition-colors active:bg-foreground active:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground hover:bg-foreground hover:text-background sm:mt-10 sm:px-8 sm:py-4"
              >
                Vezi catalogul
              </Link>
            </div>
            {edImage ? (
              <div className="bg-field">
                <img
                  src={imageVariantUrl(text(home, "editorial_image_url"), 1600) ?? edImage}
                  srcSet={imageVariantSrcSet(text(home, "editorial_image_url"), [960, 1600])}
                  sizes="(max-width: 767px) 100vw, 50vw"
                  alt={edTitle ?? ""}
                  loading="lazy"
                  decoding="async"
                  className="w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
