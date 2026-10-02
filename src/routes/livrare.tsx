import { HeadingText } from "@/components/site/HeadingText";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";

export const Route = createFileRoute("/livrare")({
  head: () => ({
    meta: [
      { title: "Livrare — Lumea Pungilor" },
      { name: "description", content: "Timp estimativ de livrare, zona de livrare, costuri și procesarea comenzilor Lumea Pungilor." },
      { property: "og:title", content: "Livrare — Lumea Pungilor" },
      { property: "og:description", content: "Timp estimativ de livrare, zona de livrare, costuri și procesarea comenzilor Lumea Pungilor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LivrarePage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="display text-2xl">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function LivrarePage() {
  return (
    <article className="site-container max-w-[900px] py-20">
      <h1 className="display text-4xl md:text-5xl"><HeadingText id="livrare_h1" /></h1>
      <p className="mt-6 text-base leading-relaxed text-muted-foreground">
        Comenzile sunt procesate și pregătite pentru livrare cât mai rapid posibil. Timpul estimativ de livrare depinde de locația destinatarului.
      </p>
      <div className="mt-10 space-y-8 text-base leading-relaxed text-foreground">
        <Section title="Timp estimativ de livrare">
          <p><strong className="font-medium">București:</strong> 1–2 zile lucrătoare de la confirmarea comenzii.</p>
          <p><strong className="font-medium">În afara Bucureștiului:</strong> Aproximativ 3 zile lucrătoare de la confirmarea comenzii.</p>
        </Section>
        <Section title="Zona de livrare">
          <p>Livrăm comenzi pe teritoriul României.</p>
        </Section>
        <Section title="Costul livrării">
          <p>Costul livrării este afișat în timpul procesului de comandă, înainte de confirmarea finală a comenzii.</p>
        </Section>
        <Section title="Procesarea comenzilor">
          <p>Timpul estimativ de livrare începe după confirmarea comenzii.</p>
          <p>Comenzile plasate în afara programului de lucru, în weekend sau în zilele de sărbătoare legală pot începe să fie procesate în următoarea zi lucrătoare.</p>
        </Section>
        <Section title="Posibile întârzieri">
          <p>În anumite situații, livrarea poate dura mai mult din cauza volumului de comenzi, disponibilității produselor, perioadelor aglomerate sau întârzierilor companiei de curierat.</p>
        </Section>
        <Section title="Probleme cu livrarea">
          <p>
            Dacă o comandă nu ajunge în intervalul estimat sau există o problemă cu livrarea, clientul ne poate contacta folosind informațiile existente de pe pagina{" "}
            <Link to="/contact" className="font-medium link-underline">Contact</Link>.
          </p>
        </Section>
      </div>
      <aside className="mt-12 border-y border-border py-6">
        <p className="micro-sm mb-4 text-muted-foreground">Datele operatorului</p>
        <CompanyIdentity />
      </aside>
    </article>
  );
}
