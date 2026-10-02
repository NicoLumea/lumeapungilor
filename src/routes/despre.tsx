import { HeadingText } from "@/components/site/HeadingText";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { COMPANY_PHONE, telephoneHref } from "@/lib/company";
import { COMPANY_LEGAL } from "@/lib/company-legal";
import { getSeoContent } from "@/lib/seo-catalog.functions";
import { staticPageHead } from "@/lib/seo-meta";
import { text } from "@/lib/content";
import { SafeMarkdown } from "@/lib/safe-markdown";

type AboutCategory = {
  title: string;
  description: string;
  slug?: string;
};

const categories: AboutCategory[] = [
  {
    title: "Pungi plastic",
    description:
      "Pungi cu imprimeu și pungi simple, în mai multe dimensiuni, pentru magazine și standuri comerciale.",
    slug: "pungute-mici",
  },
  {
    title: "Pungi curierat",
    description:
      "Pungi și plicuri autoadezive pentru expedieri, de la 16 × 24 cm până la 80 × 100 cm.",
    slug: "pungi-curierat",
  },
  {
    title: "Punguțe mici",
    description: "Pungi pentru produse mărunte, bijuterii și accesorii.",
    slug: "pungi-plastic",
  },
  {
    title: "Mușama",
    description: "Mușama la rolă și fețe de masă pentru restaurante, catering și evenimente.",
    slug: "musama",
  },
  {
    title: "Folie cu bule",
    description: "Folie pentru protejarea produselor fragile la depozitare și transport.",
    slug: "folie-cu-bule",
  },
];

export const Route = createFileRoute("/despre")({
  loader: () => getSeoContent({ data: { key: "about" } }),
  head: ({ loaderData }) =>
    staticPageHead({
      block: loaderData,
      h1: text(loaderData, "title") ?? "Despre Lumea Pungilor",
      body:
        text(loaderData, "body") ??
        "Informații despre Lumea Pungilor, gama de produse și datele companiei.",
      path: "/despre",
      image: text(loaderData, "image_url"),
    }),
  component: AboutPage,
});

function AboutSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-border pt-9 md:pt-11 ${className}`}>
      <h2 className="display text-2xl leading-tight sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

function AboutPage() {
  const block = Route.useLoaderData();
  const editableBody = text(block, "body");
  return (
    <article className="site-container max-w-[1120px] py-10 sm:py-14 md:py-16">
      <header className="max-w-4xl">
        <p className="micro-sm text-brand">Despre noi</p>
        <h1 className="display mt-4 text-4xl leading-tight sm:text-5xl">
          {text(block, "title") ?? <HeadingText id="despre_h1" />}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-foreground/85 sm:text-lg">
          Lumea Pungilor este furnizor de produse pentru ambalare, transport și servire: pungi,
          pungi de curierat, fețe de masă, mușama la rolă și folie cu bule.
        </p>
        {editableBody ? (
          <SafeMarkdown
            className="mt-6 max-w-3xl text-base text-foreground/85"
            children={editableBody}
          />
        ) : null}
      </header>

      <section
        aria-labelledby="about-location"
        className="mt-9 border border-border bg-hero p-5 sm:p-7 md:mt-11 md:p-9"
      >
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-10">
          <div className="flex min-w-0 items-start gap-4">
            <MapPin
              aria-hidden="true"
              className="mt-1 size-6 shrink-0 text-brand"
              strokeWidth={1.5}
            />
            <div className="min-w-0">
              <p className="micro-sm text-brand">Punct de lucru</p>
              <h2 id="about-location" className="display mt-2 text-2xl leading-tight sm:text-3xl">
                Ne găsiți în Dragonul Roșu
              </h2>
            </div>
          </div>
          <div className="min-w-0 md:border-l md:border-foreground/15 md:pl-8">
            <address className="not-italic text-base font-medium leading-relaxed">
              Complexul Comercial Dragonul Roșu 7, standurile 388–442
              <br />
              Str. Drumul Gării 1–10
            </address>
            <p className="mt-4 text-sm leading-relaxed text-foreground/75">
              Clienții care preferă să vadă produsele înainte de comandă ne pot vizita direct.
              Pentru comenzi mai mari sau produse care nu apar în magazinul online, ne puteți suna
              înainte de vizită.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-10 space-y-10 md:mt-14 md:space-y-14">
        <AboutSection title="Despre noi">
          <div className="mt-5 grid gap-5 text-sm leading-relaxed text-foreground/80 sm:text-base md:grid-cols-2 md:gap-10">
            <p>
              Ne desfășurăm activitatea în Complexul Comercial Dragonul Roșu 7, la standurile
              388–442. De aici livrăm în toată România și primim clienți direct la stand.
            </p>
            <p>
              Toate produsele se vând la set. Cantitatea inclusă și prețul pe bucată sunt afișate pe
              pagina fiecărui produs.
            </p>
          </div>
        </AboutSection>

        <AboutSection title="Ce găsiți în catalog">
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const content = (
                <>
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-lg font-medium leading-snug">{category.title}</span>
                    {category.slug ? (
                      <ArrowUpRight
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-brand"
                      />
                    ) : null}
                  </span>
                  <span className="mt-3 block text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </span>
                </>
              );

              return category.slug ? (
                <Link
                  key={category.title}
                  to="/categorie/$slug"
                  params={{ slug: category.slug }}
                  className="group min-w-0 border border-border bg-background p-5 transition-colors hover:border-foreground/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:p-6"
                  aria-label={`Vezi categoria ${category.title}`}
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={category.title}
                  className="min-w-0 border border-border bg-field p-5 sm:p-6"
                >
                  {content}
                </div>
              );
            })}
          </div>
        </AboutSection>

        <AboutSection title="Cui ne adresăm">
          <div className="mt-5 grid gap-4 text-sm leading-relaxed text-foreground/80 sm:text-base md:grid-cols-2 md:gap-10">
            <p>
              Lucrăm cu magazine și standuri comerciale, revânzători, magazine de haine și cadouri,
              restaurante, firme de catering, organizatori de evenimente, ateliere, saloane și
              magazine online care expediază produse.
            </p>
            <p>Primim atât comenzi online, cât și clienți care cumpără direct din complex.</p>
          </div>
        </AboutSection>

        <AboutSection title="Comenzi și livrare">
          <div className="mt-5 grid gap-4 text-sm leading-relaxed text-foreground/80 sm:text-base md:grid-cols-2 md:gap-10">
            <p>
              Comenzile se plasează direct în magazinul online, cu sau fără cont de client. Livrăm
              în toată România.
            </p>
            <p>
              Pentru întrebări despre produse, stoc sau comenzi mai mari, ne puteți contacta
              telefonic de luni până vineri, între 09:00 și 17:00.
            </p>
          </div>
          <Link
            to="/produse"
            className="micro mt-5 inline-flex min-h-11 items-center link-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Explorează catalogul
          </Link>
        </AboutSection>

        <AboutSection title="Datele companiei">
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-foreground/80 sm:text-base">
            Magazinul online lumeapungilor.ro este operat de {COMPANY_LEGAL.name}, cu sediul în{" "}
            {COMPANY_LEGAL.registeredOffice}.
          </p>
          <dl className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
            <div className="min-w-0 bg-background p-5 sm:p-6">
              <dt className="micro-sm text-muted-foreground">CUI</dt>
              <dd className="mt-2 text-sm font-medium">{COMPANY_LEGAL.cui}</dd>
            </div>
            <div className="min-w-0 bg-background p-5 sm:p-6">
              <dt className="micro-sm text-muted-foreground">
                Nr. înregistrare la Registrul Comerțului
              </dt>
              <dd className="mt-2 break-words text-sm font-medium">
                {COMPANY_LEGAL.tradeRegisterNumber}
              </dd>
            </div>
            <div className="min-w-0 bg-background p-5 sm:p-6">
              <dt className="micro-sm text-muted-foreground">TVA</dt>
              <dd className="mt-2 text-sm font-medium">{COMPANY_LEGAL.vatStatement}</dd>
            </div>
            <div className="min-w-0 bg-background p-5 sm:p-6">
              <dt className="micro-sm text-muted-foreground">Punct de lucru</dt>
              <dd className="mt-2 text-sm leading-relaxed">
                Complexul Comercial Dragonul Roșu 7, standurile 388–442, Str. Drumul Gării 1–10
              </dd>
            </div>
            <div className="min-w-0 bg-background p-5 sm:p-6">
              <dt className="micro-sm text-muted-foreground">Telefon</dt>
              <dd className="mt-2 flex flex-col items-start gap-1 text-sm">
                <a
                  href={telephoneHref(COMPANY_PHONE)}
                  className="inline-flex min-h-11 items-center link-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {COMPANY_PHONE}
                </a>
              </dd>
            </div>
            <div className="min-w-0 bg-background p-5 sm:p-6">
              <dt className="micro-sm text-muted-foreground">Program</dt>
              <dd className="mt-2 text-sm font-medium">luni–vineri, 09:00–17:00</dd>
            </div>
          </dl>
        </AboutSection>

        <section className="border-t border-border bg-hero px-5 py-8 sm:px-8 md:flex md:items-center md:justify-between md:gap-8 md:py-10">
          <div className="min-w-0">
            <h2 className="display text-2xl sm:text-3xl">
              <HeadingText id="despre_cta_h2" />
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              Alegeți produsele din catalog sau contactați-ne pentru mai multe informații.
            </p>
          </div>
          <div className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row md:mt-0 md:shrink-0">
            <Button
              asChild
              className="micro min-h-11 w-full rounded-none px-6 shadow-none sm:w-auto"
            >
              <Link to="/produse">Vezi produsele</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="micro min-h-11 w-full rounded-none border-foreground bg-transparent px-6 shadow-none sm:w-auto"
            >
              <Link to="/contact">Contactează-ne</Link>
            </Button>
          </div>
        </section>
      </div>
    </article>
  );
}
