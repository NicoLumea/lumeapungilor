import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/guide")({
  component: Guide,
});

const SECTIONS: { title: string; steps: string[] }[] = [
  {
    title: "Adaugă un produs nou",
    steps: [
      "Intră în Produse și apasă „Produs nou”.",
      "Completează numele, categoria, prețul și unitatea de vânzare (bucată, set, bax).",
      "Dacă vinzi la bax, scrie câte bucăți conține un bax; site-ul afișează automat și prețul pe bucată.",
      "Încarcă fotografiile. Prima fotografie este cea principală, a doua apare la trecerea cu mouse-ul.",
      "Lasă produsul pe „Ciornă” cât timp lucrezi la el, apoi treci-l pe „Publicat” ca să apară pe site.",
    ],
  },
  {
    title: "Modifică preț, titlu sau fotografii",
    steps: [
      "Deschide produsul din listă, schimbă ce vrei și apasă „Salvează”.",
      "Modificările apar imediat pe site, după reîncărcarea paginii.",
      "Ca să scoți temporar un produs, treci-l pe „Ciornă” sau bifează „Arhivat”.",
    ],
  },
  {
    title: "Organizează categoriile",
    steps: [
      "În Categorii poți adăuga, redenumi, ascunde sau șterge o categorie.",
      "Ordinea numerică stabilește ordinea din meniu și de pe pagina principală.",
    ],
  },
  {
    title: "Schimbă textele și datele firmei",
    steps: [
      "În Conținut site editezi pagina principală, Despre, Contact, Livrare, Retur, Termeni și Confidențialitate.",
      "Tot acolo completezi denumirea firmei, CUI, adresa, telefonul și e-mailul afișate în subsol și pe pagina de contact.",
      "Tot în Conținut site setezi costul livrării, pragul de livrare gratuită și cota TVA folosite la finalizarea comenzii.",
    ],
  },
  {
    title: "Gestionează comenzile",
    steps: [
      "Comenzile noi apar în Comenzi, cu toate datele clientului și produsele cerute.",
      "Schimbă statusul pe măsură ce procesezi comanda și adaugă notițe interne, vizibile doar ție.",
      "Până la activarea plăților online, comenzile sunt marcate TEST: nu se încasează bani.",
    ],
  },
];

function Guide() {
  return (
    <div className="mx-auto max-w-[820px]">
      <h1 className="display text-3xl">Ghid de administrare</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Tot ce apare pe site se schimbă din acest panou, fără cunoștințe tehnice.
      </p>
      <div className="mt-10 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="micro">{s.title}</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {s.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
