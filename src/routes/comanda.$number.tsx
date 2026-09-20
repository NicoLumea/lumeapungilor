import { createFileRoute, Link } from "@tanstack/react-router";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { companyInfo, telephoneHref } from "@/lib/company";

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
  const phones = [companyInfo.phone_primary, companyInfo.phone_secondary].filter(Boolean) as string[];

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
        {phones.map((p) => (
          <a
            key={p}
            href={telephoneHref(p)}
            className="micro-sm inline-flex min-h-11 items-center border border-border px-5 py-2.5"
          >
            {p}
          </a>
        ))}
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
