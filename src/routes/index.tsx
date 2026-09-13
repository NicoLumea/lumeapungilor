import { createFileRoute, Link } from "@tanstack/react-router";
import heroBackground from "@/assets/lumea-pungilor-b2b-header-1920x800.png.asset.json";
import { useCategories, useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumea Pungilor — Ambalaje pentru afaceri" },
      {
        name: "description",
        content:
          "Furnizor de pungi de plastic, pungi de hârtie, fețe de masă și folie cu bule pentru afaceri.",
      },
      { property: "og:title", content: "Lumea Pungilor — Ambalaje pentru afaceri" },
      {
        property: "og:description",
        content: "Pungi de plastic, pungi de hârtie, fețe de masă și folie cu bule.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: content } = useContent();
  const { data: categories } = useCategories();
  const home = content?.["home"];

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
                className="micro mt-10 inline-flex border border-foreground px-8 py-4 transition-colors hover:bg-foreground hover:text-background"
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
        <section className="site-container py-20">
          <p className="micro-sm text-muted-foreground">Categorii</p>
          <div className="mt-8 grid grid-cols-2 gap-x-[clamp(16px,2vw,32px)] gap-y-10 lg:grid-cols-4">
            {(categories ?? []).map((c) => {
              const img = imageUrl(c.image_url);
              return (
                <Link key={c.id} to="/categorie/$slug" params={{ slug: c.slug }} className="group block">
                  <div className="product-field">
                    {img ? (
                      <img
                        src={img}
                        alt={c.name}
                        loading="lazy"
                        className="absolute inset-0 size-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <span className="micro-sm text-muted-foreground">{c.name}</span>
                      </div>
                    )}
                  </div>
                  <p className="micro mt-3">{c.name}</p>
                  {c.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {edTitle || edBody || edImage ? (
        <section className="rule-t">
          <div className="site-container grid items-center gap-12 py-24 md:grid-cols-2">
            <div>
              {edTitle ? <h2 className="display text-3xl md:text-5xl">{edTitle}</h2> : null}
              {edBody ? (
                <p className="mt-6 max-w-md whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                  {edBody}
                </p>
              ) : null}
              <Link
                to="/produse"
                className="micro mt-10 inline-flex border border-foreground px-8 py-4 transition-colors hover:bg-foreground hover:text-background"
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
