import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/staff/")({
  component: StaffHome,
});

const CARDS: { to: string; title: string; text: string }[] = [
  { to: "/staff/produse", title: "Produse și stoc", text: "Adaugă produse, fotografii, prețuri și cantități." },
  { to: "/staff/categorii", title: "Categorii", text: "Organizează categoriile și ordinea lor." },
  { to: "/staff/comenzi", title: "Comenzi", text: "Vezi comenzile și schimbă-le statusul." },
  { to: "/staff/retururi", title: "Retururi", text: "Cereri de retur, retragere și reclamații." },
  { to: "/staff/mesaje", title: "Mesaje", text: "Mesajele primite prin formularul de contact." },
  { to: "/staff/continut", title: "Conținut", text: "Textele paginilor și produsele recomandate." },
];

function StaffHome() {
  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="display text-3xl">Panou angajați</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        De aici administrezi produsele, comenzile și textele site-ului. Gestionarea conturilor, a
        setărilor și jurnalul de audit sunt disponibile doar administratorilor.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to as "/staff/produse"}
            className="border border-border p-6 transition-colors hover:border-foreground"
          >
            <p className="micro-sm">{c.title}</p>
            <p className="mt-3 text-sm text-muted-foreground">{c.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
