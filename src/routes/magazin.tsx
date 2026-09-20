import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import heroBackground from "@/assets/lumea-pungilor-b2b-header-1920x800.png.asset.json";
import { ProductCard } from "@/components/site/ProductCard";
import { useCategories, useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";
import { usePublishedProducts } from "@/lib/products";
import { getTopSellingProducts } from "@/lib/recommendations.functions";
import { companyInfo, telephoneHref } from "@/lib/company";

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
  const topSelling = useServerFn(getTopSellingProducts);
  const { data: sales } = useQuery({
    queryKey: ["recommendations", "top-selling"],
    queryFn: () => topSelling(),
    staleTime: 5 * 60 * 1000,
  });
  const home = content?.["home"];
  const company = companyInfo(content);
  const availableProducts = (products ?? []).filter((product) => !product.track_stock || product.stock > 0);

  // Real sales ranking when it exists; otherwise only products an employee marked as featured.
  const salesRanked = (sales?.productIds ?? [])
    .map((id) => availableProducts.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const useSales = !!sales?.fromSales && salesRanked.length > 0;
  const recommended = useSales
    ? salesRanked.slice(0, 5)
    : availableProducts.filter((p) => p.is_featured).slice(0, 5);
  const recommendedHeading = useSales ? "Cele mai cumpărate" : "Produse recomandate";

  const heroTitle = text(home, "hero_title") ?? "Ambalaje pentru magazine, restaurante și ateliere";
  const heroSubtitle =
    text(home, "hero_subtitle") ??
    "Pungi cu mâner, pungi fără mâner, fețe de masă și folie cu bule, disponibile pentru comenzi de la persoane fizice și firme.";
  const edTitle = text(home, "editorial_title");
  const edBody = text(home, "editorial_body");
  const edImage = imageUrl(text(home, "editorial_image_url"));

  return (
    <div>
      <section className="overflow-hidden border-b border-border bg-hero">
        <div className="relative mx-auto w-full max-w-[1920px]">
          <div className="site-container relative z-10 py-10 lg:absolute lg:inset-0 lg:grid lg:w-full lg:max-w-none lg:grid-cols-[42%_58%] lg:items-center lg:py-0">
            <div className="max-w-[520px] text-left lg:px-[clamp(32px,3vw,56px)]">
              <h1 className="display text-3xl leading-[1.08] lg:text-[clamp(32px,2.6vw,44px)]">{heroTitle}</h1>
              <p className="mt-4 max-w-md text-base leading-[1.5] text-foreground/80 lg:text-[clamp(15px,1.1vw,17px)]">
                {heroSubtitle}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/produse"
                  className="micro inline-flex min-h-11 w-fit max-w-full items-center border border-foreground bg-foreground px-6 py-3 text-background transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  Vezi catalogul
                </Link>
                <Link
                  to="/contact"
                  className="micro inline-flex min-h-11 w-fit max-w-full items-center border border-foreground px-6 py-3 transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  Contactează-ne
                </Link>
              </div>
            </div>
          </div>
          <img
            src={heroBackground.url}
            alt="Colecție de pungi din plastic pentru comenzi en-gros Lumea Pungilor."
            width="1920"
            height="800"
            fetchPriority="high"
            className="pointer-events-none relative block h-auto max-h-[320px] w-full object-contain lg:absolute lg:inset-0 lg:size-full lg:max-h-none lg:object-contain lg:object-right"
          />
          <div className="hidden lg:block lg:h-[clamp(420px,34vw,500px)]" aria-hidden="true" />
        </div>
      </section>

      <section className="border-b border-border">
        <ul className="site-container grid gap-3 py-5 text-sm sm:grid-cols-3">
          <li className="text-muted-foreground">Comenzi pentru persoane fizice și firme</li>
          <li className="text-muted-foreground">
            Asistență:{" "}
            <a href={telephoneHref(company.phonePrimary)} className="link-underline text-foreground">
              {company.phonePrimary}
            </a>
          </li>
          <li className="text-muted-foreground">
            {company.operatingDays ? `${company.operatingDays} ${company.operatingHours ?? ""}`.trim() : "Program de lucru afișat la Contact"}
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

      <section className="rule-t">
        <div className="site-container grid gap-6 py-10 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:items-start md:gap-12 md:py-14">
          <h2 className="display text-3xl md:text-4xl">Despre Lumea Pungilor</h2>
          <div>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Lumea Pungilor reunește într-un singur catalog produse practice pentru ambalare, servire și protejarea mărfurilor. Oferta include pungi cu mâner, pungi fără mâner, fețe de masă și folie cu bule pentru magazine, revânzători, restaurante, ateliere și alte activități profesionale.
            </p>
            <Link
              to="/despre"
              className="micro mt-6 inline-flex min-h-11 w-fit items-center border border-foreground px-5 py-2.5 transition-colors active:bg-foreground active:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground hover:bg-foreground hover:text-background"
            >
              Află mai multe despre noi
            </Link>
          </div>
        </div>
      </section>

      {recommended.length > 0 ? (
        <section className="rule-t">
          <div className="catalogue-container py-10 md:py-20">
            <div className="max-w-2xl">
              <h2 className="display text-3xl md:text-4xl">{recommendedHeading}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {useSales
                  ? "Produse alese cel mai des de clienții noștri, disponibile acum în stoc."
                  : "Produse disponibile, selectate din catalog."}
              </p>
            </div>
            <div className="product-grid mt-7 md:mt-10">
              {recommended.map((product) => (
                <ProductCard key={product.id} product={product} />
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
