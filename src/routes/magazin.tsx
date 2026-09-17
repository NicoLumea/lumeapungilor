import { createFileRoute, Link } from "@tanstack/react-router";
import heroBackground from "@/assets/lumea-pungilor-b2b-header-1920x800.png.asset.json";
import { FeaturedProductCard } from "@/components/site/FeaturedProductCard";
import { useCategories, useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";
import { usePublishedProducts } from "@/lib/products";

export const Route = createFileRoute("/magazin")({
  head: () => ({
    meta: [
      { title: "Magazin — Lumea Pungilor" },
      {
        name: "description",
        content:
          "Furnizor de pungi de plastic, pungi de hârtie, fețe de masă și folie cu bule pentru afaceri.",
      },
      { property: "og:title", content: "Magazin — Lumea Pungilor" },
      {
        property: "og:description",
        content: "Pungi de plastic, pungi de hârtie, fețe de masă și folie cu bule.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { data: content } = useContent();
  const { data: categories } = useCategories();
  const { data: products } = usePublishedProducts();
  const home = content?.["home"];
  const availableProducts = (products ?? []).filter((product) => !product.track_stock || product.stock > 0);
  const featuredProducts = [
    ...availableProducts.filter((product) => product.is_featured),
    ...availableProducts.filter((product) => !product.is_featured),
  ].slice(0, 6);

  const heroTitle = text(home, "hero_title");
  const heroSubtitle = text(home, "hero_subtitle");
  const ctaLabel = text(home, "cta_label");
  const ctaHref = text(home, "cta_href") ?? "/produse";
  const edTitle = text(home, "editorial_title");
  const edBody = text(home, "editorial_body");
  const edImage = imageUrl(text(home, "editorial_image_url"));

  return (
    <div>
      <section className="overflow-hidden border-b border-border bg-hero">
        <div className="relative mx-auto w-full max-w-[1920px] lg:aspect-[12/5]">
          <div className="site-container relative z-10 py-10 lg:absolute lg:inset-0 lg:grid lg:w-full lg:max-w-none lg:grid-cols-[38%_62%] lg:items-center lg:py-0">
            <div className="max-w-[520px] text-left lg:px-[clamp(32px,3vw,56px)]">
            {heroTitle ? <h1 className="display text-4xl leading-[1.05] lg:text-[clamp(44px,4vw,68px)]">{heroTitle}</h1> : null}
            {heroSubtitle ? (
              <p className="mt-6 max-w-md text-base leading-[1.5] text-foreground/80 lg:text-[clamp(16px,1.25vw,19px)]">
                {heroSubtitle}
              </p>
            ) : null}
            {ctaLabel ? (
              <a
                href={ctaHref}
                className="micro mt-7 inline-flex min-h-11 w-fit max-w-full items-center border border-foreground px-5 py-2.5 transition-colors active:bg-foreground active:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground hover:bg-foreground hover:text-background sm:mt-10 sm:px-8 sm:py-4"
              >
                {ctaLabel}
              </a>
            ) : null}
            </div>
          </div>
          <img
            src={heroBackground.url}
            alt="Colecție de pungi din plastic pentru comenzi en-gros Lumea Pungilor."
            width="1920"
            height="800"
            fetchPriority="high"
            className="pointer-events-none relative block h-auto w-full object-contain lg:absolute lg:inset-0 lg:size-full lg:object-contain lg:object-center"
          />
        </div>
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
                  params={{ slug: c.slug }}
                  className="category-card group block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  <div className="category-card-media relative aspect-[4/5] overflow-hidden bg-field md:aspect-[3/4]">
                    {img ? (
                      <img
                        src={img}
                        alt={c.name}
                        loading="lazy"
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
                    <p className="line-clamp-2 inline text-xs font-medium uppercase leading-4 sm:text-[0.6875rem] sm:leading-[1.2]">
                      {c.name}
                    </p>
                  </div>
                  {c.description ? (
                    <p className="mt-1 hidden text-sm text-muted-foreground md:block">{c.description}</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {featuredProducts.length > 0 ? (
        <section className="rule-t">
          <div className="catalogue-container py-10 md:py-20">
            <div className="max-w-2xl">
              <h2 className="display text-3xl md:text-4xl">Produse recomandate</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Descoperă câteva dintre produsele disponibile în catalog.
              </p>
            </div>
            <div className="featured-products-grid mt-7 md:mt-10">
              {featuredProducts.map((product, index) => (
                <FeaturedProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
                <img src={edImage} alt={edTitle ?? ""} className="w-full object-cover" />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
