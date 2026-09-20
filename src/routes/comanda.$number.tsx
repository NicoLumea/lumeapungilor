import { createFileRoute, Link } from "@tanstack/react-router";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { SUPPORT_EMAIL } from "@/lib/company";

export const Route = createFileRoute("/comanda/$number")({
  head: () => ({
    meta: [
      { title: "Cerere de comandă înregistrată — Lumea Pungilor" },
      { name: "description", content: "Confirmarea cererii tale de comandă." },
      { property: "og:title", content: "Cerere de comandă înregistrată — Lumea Pungilor" },
      { property: "og:description", content: "Confirmarea cererii tale de comandă." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmation,
});

function OrderConfirmation() {
  const { number } = Route.useParams();

  return (
    <div className="site-container max-w-[720px] py-32 text-center">
      <p className="micro-sm text-muted-foreground">Confirmare</p>
      <h1 className="display mt-4 text-3xl md:text-4xl">
        Cererea ta de comandă a fost înregistrată
      </h1>
      <p className="mt-6 text-sm text-muted-foreground">
        Numărul comenzii tale este <span className="text-foreground">{number}</span>.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Echipa Lumea Pungilor te va contacta pentru confirmarea disponibilității, a livrării și a
        modalității de plată.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href="tel:+40765514422"
          className="micro-sm inline-flex min-h-11 items-center border border-border px-5 py-2.5"
        >
          0765 514 422
        </a>
        <a
          href="tel:+40371900033"
          className="micro-sm inline-flex min-h-11 items-center border border-border px-5 py-2.5"
        >
          0371 900 033
        </a>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="micro-sm inline-flex min-h-11 items-center border border-border px-5 py-2.5"
        >
          {SUPPORT_EMAIL}
        </a>
      </div>
      <div className="mx-auto mt-8 max-w-xl border-y border-border py-5 text-left">
        <p className="micro-sm mb-3 text-muted-foreground">Datele vânzătorului</p>
        <CompanyIdentity sellerLabel showPhones />
      </div>
      <Link
        to="/produse"
        className="micro mt-10 inline-flex border border-foreground px-8 py-4 transition-colors hover:bg-foreground hover:text-background"
      >
        Înapoi la catalog
      </Link>
    </div>
  );
}
