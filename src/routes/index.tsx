import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthPanel } from "@/components/site/AuthPanel";
import { FeaturedProductCard } from "@/components/site/FeaturedProductCard";
import { useCategories, useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";
import { usePublishedProducts } from "@/lib/products";
import { useAuth } from "@/lib/use-auth";

type EntrySearch = { redirect?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): EntrySearch => {
    const raw = typeof search["redirect"] === "string" ? (search["redirect"] as string) : "";
    return raw.startsWith("/") ? { redirect: raw } : {};
  },
  head: () => ({
    meta: [
      { title: "Lumea Pungilor — Ambalaje pentru afaceri" },
      {
        name: "description",
        content:
          "Furnizor de pungi de plastic, fețe de masă și folie cu bule. Intră în magazin sau creează-ți un cont de client.",
      },
      { property: "og:title", content: "Lumea Pungilor — Ambalaje pentru afaceri" },
      {
        property: "og:description",
        content: "Ambalaje pentru afaceri: catalog, cont de client și comenzi online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntryPage,
});

const BENEFITS = [
  "Istoricul comenzilor și statusul lor, la un loc.",
  "Date de contact și livrare salvate, comandă mai rapidă.",
  "Comenzi repetate, fără limită de produse diferite.",
  "Cereri de retur, retragere și reclamații direct din cont.",
];

function EntryPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const auth = useAuth();
  const { data: content } = useContent();
  const { data: categories } = useCategories();
  const { data: products } = usePublishedProducts();

  const company = content?.["company"];
  const home = content?.["home"];
  const available = (products ?? []).filter((p) => !p.track_stock || p.stock > 0);
  const featured = [
    ...available.filter((p) => p.is_featured),
    ...available.filter((p) => !p.is_featured),
  ].slice(0, 6);

  const intro = text(home, "hero_text") ?? text(company, "tagline");

  return (
    <div>
      <section className="border-b border-border bg-hero">
        <div className="site-container py-14 md:py-24">
          <p className="micro-sm text-muted-foreground">Lumea Pungilor</p>
          <h1 className="display mt-4 max-w-3xl text-4xl leading-[1.05] md:text-6xl">
            Ambalaje pentru afacerea ta, comandate simplu
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/80">
            {intro ??
              "Livrăm pungi de plastic, fețe de masă și folie cu bule pentru magazine, restaurante și ateliere din toată țara."}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/magazin"
              className="micro inline-flex min-h-11 items-center border border-foreground bg-foreground px-6 py-3 text-background transition-opacity hover:opacity-85"
            >
              {auth.user ? "Intră în magazin" : "Continuă ca vizitator"}
            </Link>
            {auth.user ? (
              <Link
                to="/cont"
                className="micro inline-flex min-h-11 items-center border border-foreground px-6 py-3 transition-colors hover:bg-foreground hover:text-background"
              >
                Contul meu
              </Link>
            ) : (
              <a
                href="#cont"
                className="micro inline-flex min-h-11 items-center border border-foreground px-6 py-3 transition-colors hover:bg-foreground hover:text-background"
              >
                Autentificare
              </a>
            )}
          </div>
        </div>
      </section>

      {(categories ?? []).length > 0 ? (
        <section className="site-container py-10 md:py-20">
          <p className="micro-sm text-muted-foreground">Categorii principale</p>
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
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className="rule-t">
          <div className="catalogue-container py-10 md:py-20">
            <div className="max-w-2xl">
              <h2 className="display text-3xl md:text-4xl">Produse recomandate</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Descoperă câteva dintre produsele disponibile în catalog.
              </p>
            </div>
            <div className="featured-products-grid mt-7 md:mt-10">
              {featured.map((product, index) => (
                <FeaturedProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="cont" className="rule-t scroll-mt-20">
        <div className="site-container grid gap-10 py-10 md:grid-cols-2 md:gap-16 md:py-20">
          <div>
            <h2 className="display text-3xl md:text-4xl">Cont de client</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Poți comanda și fără cont, o singură dată, cu un număr limitat de produse diferite. Cu un
              cont ai acces la toate avantajele de mai jos.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {BENEFITS.map((b) => (
                <li key={b} className="border-l border-brand pl-4">
                  {b}
                </li>
              ))}
            </ul>
            <Link
              to="/ajutor-comanda"
              className="micro-sm mt-6 inline-block underline underline-offset-4"
            >
              Ai comandat fără cont? Ajutor pentru comanda ta
            </Link>
          </div>

          {auth.user ? (
            <div className="border border-border p-6 md:p-8">
              <p className="micro-sm text-muted-foreground">Ești autentificat</p>
              <p className="mt-3 text-sm">{auth.user.email}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/magazin"
                  className="micro inline-flex min-h-11 items-center border border-foreground bg-foreground px-5 py-3 text-background"
                >
                  Intră în magazin
                </Link>
                <Link
                  to="/cont"
                  className="micro inline-flex min-h-11 items-center border border-foreground px-5 py-3"
                >
                  Contul meu
                </Link>
              </div>
            </div>
          ) : (
            <AuthPanel
              onSignedIn={() => {
                const target = search.redirect;
                if (target) window.location.assign(target);
                else navigate({ to: "/cont" });
              }}
            />
          )}
        </div>
      </section>

      <section className="rule-t">
        <div className="site-container grid gap-8 py-10 text-sm md:grid-cols-3 md:py-16">
          <div>
            <p className="micro-sm text-muted-foreground">Contact</p>
            {text(company, "email") ? <p className="mt-3">{text(company, "email")}</p> : null}
            {text(company, "phone") ? <p className="mt-1">{text(company, "phone")}</p> : null}
            {text(company, "address") ? (
              <p className="mt-1 whitespace-pre-line text-muted-foreground">
                {text(company, "address")}
              </p>
            ) : null}
          </div>
          <div>
            <p className="micro-sm text-muted-foreground">Informații</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/despre" className="link-underline">
                  Despre noi
                </Link>
              </li>
              <li>
                <Link to="/livrare" className="link-underline">
                  Livrare
                </Link>
              </li>
              <li>
                <Link to="/contact" className="link-underline">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="micro-sm text-muted-foreground">Legal</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/termeni" className="link-underline">
                  Termeni și condiții
                </Link>
              </li>
              <li>
                <Link to="/confidentialitate" className="link-underline">
                  Confidențialitate
                </Link>
              </li>
              <li>
                <Link to="/retur" className="link-underline">
                  Retur și retragere
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
