import { HeadingText } from "@/components/site/HeadingText";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { getSeoContent } from "@/lib/seo-catalog.functions";
import { staticPageHead } from "@/lib/seo-meta";
import { text } from "@/lib/content";
import { SafeMarkdown } from "@/lib/safe-markdown";

export const Route = createFileRoute("/retur")({
  loader: () => getSeoContent({ data: { key: "returns" } }),
  head: ({ loaderData }) =>
    staticPageHead({
      block: loaderData,
      h1: text(loaderData, "title") ?? "Retururi și reclamații",
      body:
        text(loaderData, "body") ??
        "Condiții și pași pentru trimiterea unei cereri de retur sau reclamații privind o comandă.",
      path: "/retur",
      image: text(loaderData, "image_url"),
    }),
  component: ReturnsPage,
});

function ReturnsPage() {
  const block = Route.useLoaderData();
  return (
    <article className="site-container max-w-[900px] py-16 sm:py-20">
      <p className="micro-sm text-muted-foreground">Asistență clienți</p>
      <h1 className="display mt-3 text-4xl md:text-5xl">
        {text(block, "title") ?? <HeadingText id="retur_h1" />}
      </h1>
      <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
        Dacă există o problemă cu produsele primite, ne poți trimite o cerere de retur sau
        reclamație folosind formularul disponibil pentru comanda ta.
      </p>
      {text(block, "body") ? (
        <SafeMarkdown
          className="mt-6 max-w-3xl text-base text-muted-foreground"
          children={text(block, "body")}
        />
      ) : null}

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="display text-2xl">
          <HeadingText id="retur_conditii_h2" />
        </h2>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
          <li>Comanda trebuie să fie achitată.</li>
          <li>
            Pentru reclamațiile privind produse deteriorate, greșite, incomplete sau neconforme cu
            comanda, solicitarea trebuie transmisă în maximum 3 zile lucrătoare de la primirea
            coletului.
          </li>
          <li>Cererea trebuie să includă informațiile comenzii și produsului.</li>
          <li>
            Pentru verificarea solicitării, este necesară transmiterea unor fotografii clare ale
            produsului și, atunci când este relevant, ale ambalajului.
          </li>
          <li>Cererea va fi analizată de companie înainte de confirmarea returului.</li>
        </ol>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="display text-2xl">
          <HeadingText id="retur_proces_h2" />
        </h2>
        <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          {[
            "Completează formularul.",
            "Selectează comanda și produsul.",
            "Descrie problema.",
            "Încarcă fotografiile relevante.",
            "Trimite cererea.",
            "Echipa Lumea Pungilor verifică solicitarea.",
            "Primești instrucțiuni privind returul.",
            "După aprobare și procesare, rambursarea este procesată.",
          ].map((step, index) => (
            <li key={step} className="border border-border p-4">
              <span className="micro-sm mr-3 text-muted-foreground">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          După aprobarea și procesarea returului, rambursarea poate dura până la aproximativ 7 zile,
          în funcție de metoda de plată și procesarea financiară.
        </p>
      </section>

      <section className="mt-12 border border-border p-6 sm:p-8">
        <h2 className="display text-2xl">
          <HeadingText id="retur_cerere_h2" />
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Alege varianta potrivită comenzii tale. Formularul afișează numai comenzile achitate și
          produsele care apar în acestea.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/retururi"
            className="micro inline-flex min-h-11 items-center bg-foreground px-6 text-background"
          >
            Am cont
          </Link>
          <Link
            to="/ajutor-comanda"
            className="micro inline-flex min-h-11 items-center border border-foreground px-6"
          >
            Am comandat fără cont
          </Link>
        </div>
      </section>

      <section className="mt-12 border-l-2 border-brand pl-5">
        <h2 className="display text-xl">Drepturile legale</h2>
        <p className="mt-3 text-sm leading-relaxed">
          Prezenta procedură pentru reclamații nu limitează drepturile legale de care beneficiază
          consumatorii conform legislației aplicabile.
        </p>
      </section>
      <aside className="mt-12 border-y border-border py-6">
        <p className="micro-sm mb-4 text-muted-foreground">Datele operatorului</p>
        <CompanyIdentity />
      </aside>
    </article>
  );
}
