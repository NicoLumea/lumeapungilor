import { createFileRoute, Link } from "@tanstack/react-router";
import heroBackground from "@/assets/lumea-pungilor-hero-wide.jpg.asset.json";
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
      <section
        className="relative min-h-[500px] border-b border-border bg-cover bg-[position:center_center] bg-no-repeat md:min-h-[650px]"
        style={{ backgroundImage: `url(${heroBackground.url})` }}
      >
        <div className="absolute inset-0 bg-background/25" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[500px] max-w-[1600px] items-center px-4 py-16 md:min-h-[650px] md:px-8 md:py-24">
          <div className="max-w-3xl bg-background/70 p-5 backdrop-blur-[2px] md:bg-transparent md:p-0 md:backdrop-blur-none">
            {heroTitle ? <h1 className="display text-4xl md:text-6xl">{heroTitle}</h1> : null}
            {heroSubtitle ? (
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
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
      </section>

      {(categories ?? []).length > 0 ? (
        <section className="mx-auto max-w-[1600px] px-4 py-20 md:px-8">
          <p className="micro-sm text-muted-foreground">Categorii</p>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
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
          <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-4 py-24 md:grid-cols-2 md:px-8">
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
