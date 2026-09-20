import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { companyInfo, telephoneHref } from "@/lib/company";
import { useContent } from "@/lib/content";

const faqItems = [
  {
    question: "Ce este Lumea Pungilor?",
    answer:
      "Lumea Pungilor este un magazin online operat de S.C. ZEBE MARKET S.R.L., specializat în produse precum pungi, fețe de masă și folie cu bule.",
  },
  {
    question: "Ce tipuri de produse sunt disponibile?",
    answer:
      "Catalogul este organizat în jurul categoriilor pungi cu mâner, pungi fără mâner, fețe de masă și folie cu bule. Produsele disponibile și situația stocului pot fi consultate în catalog.",
  },
  {
    question: "Cui i se adresează magazinul?",
    answer:
      "Magazinul se adresează magazinelor, revânzătorilor, restaurantelor, firmelor de catering, organizatorilor de evenimente, atelierelor, magazinelor online și altor clienți care utilizează produse pentru ambalare, servire sau protecție.",
  },
  {
    question: "Produsele se comercializează individual?",
    answer:
      "Produsele sunt comercializate în seturi. Cantitatea de bucăți inclusă într-un set este afișată în pagina fiecărui produs.",
  },
  {
    question: "Se poate comanda fără cont?",
    answer:
      "Da. Website-ul permite plasarea unei comenzi ca vizitator, în limitele și condițiile afișate în procesul de comandă.",
  },
  {
    question: "Unde pot vedea produsele disponibile?",
    answer:
      "Produsele pot fi consultate în catalogul Lumea Pungilor și în paginile dedicate fiecărei categorii.",
  },
  {
    question: "Cum pot contacta Lumea Pungilor?",
    answer:
      "Lumea Pungilor poate fi contactat la numerele 0765 514 422 și 0371 900 033, de luni până vineri, între orele 09:00 și 17:00.",
  },
];

export const Route = createFileRoute("/despre")({
  head: () => ({
    meta: [
      { title: "Despre Lumea Pungilor — Pungi, fețe de masă și folie cu bule" },
      {
        name: "description",
        content:
          "Descoperă Lumea Pungilor, furnizor de pungi, fețe de masă și folie cu bule pentru magazine, revânzători și alte activități profesionale din România.",
      },
      { property: "og:title", content: "Despre Lumea Pungilor — Pungi, fețe de masă și folie cu bule" },
      {
        property: "og:description",
        content:
          "Descoperă Lumea Pungilor, furnizor de pungi, fețe de masă și folie cu bule pentru magazine, revânzători și alte activități profesionale din România.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://lumeapungilor.lovable.app/despre" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://lumeapungilor.lovable.app/despre" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useContent();
  const company = companyInfo(data);

  return (
    <article className="site-container max-w-[1000px] py-14 md:py-20">
      <header className="max-w-[900px]">
        <h1 className="display text-4xl leading-tight md:text-5xl">
          Lumea Pungilor, partener pentru aprovizionarea cu pungi și fețe de masă
        </h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/85">
          <p>
            Lumea Pungilor este un furnizor de produse practice pentru ambalare, transport, servire și protejarea mărfurilor. Oferta noastră se adresează magazinelor, revânzătorilor, restaurantelor, atelierelor, organizatorilor de evenimente și altor activități care utilizează în mod constant astfel de consumabile.
          </p>
          <p>
            Prin intermediul magazinului online, clienții pot consulta într-un singur loc diferite modele de pungi, fețe de masă și folie cu bule. Informațiile despre dimensiuni, cantitatea inclusă într-un set, variante și disponibilitate sunt prezentate în paginile produselor, astfel încât alegerea să fie cât mai clară.
          </p>
          <p>Obiectivul Lumea Pungilor este să simplifice identificarea și comandarea produselor necesare activităților comerciale de zi cu zi.</p>
        </div>
      </header>

      <AboutSection title="Produse pentru ambalare, servire și protecție">
        <p>
          Produsele pentru ambalare și servire sunt consumabile folosite în numeroase domenii. Magazinele au nevoie de pungi pentru predarea și transportarea produselor, restaurantele și organizatorii de evenimente utilizează fețe de masă, iar folia cu bule contribuie la protejarea obiectelor în timpul manipulării, depozitării sau transportului.
        </p>
        <p>
          Lumea Pungilor reunește aceste categorii într-un <Link to="/produse" className="link-underline font-medium">catalog</Link> organizat și ușor de consultat. Fiecare categorie poate fi accesată separat, iar produsele sunt prezentate individual, împreună cu informațiile comerciale relevante.
        </p>
      </AboutSection>

      <AboutSection title="Categoriile principale">
        <CategoryText title="Pungi cu mâner">
          <p>
            <Link to="/categorie/$slug" params={{ slug: "pungi-plastic" }} className="link-underline font-medium">Pungile cu mâner</Link> sunt potrivite pentru magazine, standuri comerciale, saloane, magazine de îmbrăcăminte, magazine de cadouri și alte activități în care produsele trebuie oferite clienților într-un ambalaj practic.
          </p>
          <p>Catalogul include modele cu diferite dimensiuni, culori și imprimeuri. Disponibilitatea fiecărui produs este afișată în pagina sa dedicată.</p>
        </CategoryText>
        <CategoryText title="Pungi fără mâner">
          <p>Pungile fără mâner pot fi folosite pentru ambalarea, separarea sau organizarea produselor în funcție de necesitățile fiecărei activități comerciale.</p>
          <p>Dimensiunile, designul, cantitatea inclusă în set și prețul sunt prezentate separat pentru fiecare produs.</p>
        </CategoryText>
        <CategoryText title="Fețe de masă">
          <p>
            <Link to="/categorie/$slug" params={{ slug: "fete-de-masa" }} className="link-underline font-medium">Fețele de masă</Link> sunt destinate spațiilor comerciale, restaurantelor, activităților de catering și organizării de evenimente. Acestea oferă o soluție practică pentru pregătirea și prezentarea meselor în diferite contexte.
          </p>
          <p>Modelele și variantele disponibile pot fi consultate în categoria dedicată.</p>
        </CategoryText>
        <CategoryText title="Folie cu bule">
          <p>
            <Link to="/categorie/$slug" params={{ slug: "folie-cu-bule" }} className="link-underline font-medium">Folia cu bule</Link> este utilizată pentru protejarea produselor fragile sau sensibile în timpul depozitării, manipulării și transportului.
          </p>
          <p>Este o categorie utilă pentru magazine online, depozite, ateliere, revânzători și alte afaceri care pregătesc produse pentru expediere.</p>
        </CategoryText>
      </AboutSection>

      <AboutSection title="Cui se adresează Lumea Pungilor">
        <p>Oferta Lumea Pungilor poate fi relevantă pentru:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground">
          <li>magazine și spații comerciale;</li>
          <li>revânzători;</li>
          <li>magazine de îmbrăcăminte și cadouri;</li>
          <li>restaurante și firme de catering;</li>
          <li>organizatori de evenimente;</li>
          <li>saloane și ateliere;</li>
          <li>magazine online;</li>
          <li>firme care ambalează, depozitează sau expediază produse;</li>
          <li>persoane care caută aceste produse pentru utilizări specifice.</li>
        </ul>
        <p>Produsele sunt comercializate în seturi, iar cantitatea inclusă și prețul sunt afișate în pagina fiecărui produs.</p>
      </AboutSection>

      <AboutSection title="Un catalog organizat pentru alegeri mai simple">
        <p>Pagina Despre prezintă compania și domeniul său de activitate, în timp ce catalogul este destinat produselor disponibile.</p>
        <p>
          În <Link to="/produse" className="link-underline font-medium">catalog</Link>, vizitatorii pot consulta categoriile, imaginile, dimensiunile, variantele, cantitățile per set, prețurile și situația stocului. Separarea informațiilor despre companie de informațiile comerciale ajută clienții să găsească mai repede ceea ce caută.
        </p>
        <p>Disponibilitatea produselor se poate modifica, motiv pentru care informația actuală despre stoc trebuie consultată direct în catalog.</p>
      </AboutSection>

      <AboutSection title="Comenzi și livrare">
        <p>Produsele pot fi adăugate în coș și comandate prin intermediul magazinului online. Clienții pot continua ca vizitatori sau pot utiliza un cont de client, în funcție de opțiunile disponibile pe website.</p>
        <p>
          Contul de client permite păstrarea informațiilor relevante și consultarea comenzilor într-un singur loc. Pentru comenzile fără cont, website-ul pune la dispoziție o <Link to="/ajutor-comanda" className="link-underline font-medium">pagină separată de ajutor</Link>.
        </p>
        <p>
          Livrarea este disponibilă în România. Informațiile aplicabile despre livrare, confirmarea comenzii și costuri trebuie consultate în <Link to="/livrare" className="link-underline font-medium">pagina de livrare</Link> și în procesul de finalizare a comenzii.
        </p>
      </AboutSection>

      <AboutSection title="Datele companiei">
        <p>Lumea Pungilor este operat de:</p>
        <CompanyIdentity />
        <p>Pentru informații despre produse, disponibilitate, comenzi sau colaborări, clienții ne pot contacta telefonic de luni până vineri, între orele 09:00 și 17:00.</p>
        <div className="flex flex-col items-start gap-1">
          {company.phonePrimary ? <a href={telephoneHref(company.phonePrimary)} className="inline-flex min-h-11 items-center link-underline">Telefon: {company.phonePrimary}</a> : null}
          {company.phoneSecondary ? <a href={telephoneHref(company.phoneSecondary)} className="inline-flex min-h-11 items-center link-underline">Telefon: {company.phoneSecondary} — apel cu tarif normal</a> : null}
        </div>
      </AboutSection>

      <AboutSection title="Întrebări frecvente despre Lumea Pungilor">
        <div className="divide-y divide-border border-y border-border">
          {faqItems.map((item) => (
            <section key={item.question} className="py-6">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-3">{item.answer}</p>
            </section>
          ))}
        </div>
      </AboutSection>

      <div className="border-t border-border pt-10">
        <Button asChild className="micro min-h-11 rounded-none px-6 shadow-none">
          <Link to="/produse">Vezi catalogul</Link>
        </Button>
      </div>
    </article>
  );
}

function AboutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-border pt-10 md:mt-16 md:pt-12">
      <h2 className="display text-3xl md:text-4xl">{title}</h2>
      <div className="mt-6 space-y-5 text-base leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}

function CategoryText({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-2">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}
