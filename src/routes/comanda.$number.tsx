import { createFileRoute, Link } from "@tanstack/react-router";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";

export const Route = createFileRoute("/comanda/$number")({
  head: () => ({
    meta: [
      { title: "Comandă înregistrată — Lumea Pungilor" },
      { name: "description", content: "Confirmarea comenzii tale." },
      { property: "og:title", content: "Comandă înregistrată — Lumea Pungilor" },
      { property: "og:description", content: "Confirmarea comenzii tale." },
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
      <h1 className="display mt-4 text-3xl md:text-4xl">Comanda a fost înregistrată</h1>
      <p className="mt-6 text-sm text-muted-foreground">
        Numărul comenzii tale este <span className="text-foreground">{number}</span>. Te contactăm pentru
        confirmarea detaliilor și a costului de livrare.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Plata online nu este activată, deci nu a fost efectuată nicio plată.
      </p>
      <div className="mx-auto mt-8 max-w-xl border-y border-border py-5 text-left">
        <p className="micro-sm mb-3 text-muted-foreground">Datele vânzătorului</p>
        <CompanyIdentity sellerLabel showPhones />
      </div>
      <Link
        to="/produse"
        className="micro mt-10 inline-flex border border-foreground px-8 py-4 transition-colors hover:bg-foreground hover:text-background"
      >
        Continuă cumpărăturile
      </Link>
    </div>
  );
}
