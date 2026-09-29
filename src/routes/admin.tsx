import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Pagina nu a fost găsită — Lumea Pungilor" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MissingPage,
});

function MissingPage() {
  return (
    <main className="site-container max-w-[680px] py-24 text-center sm:py-32">
      <p className="micro-sm text-muted-foreground">404</p>
      <h1 className="display mt-4 text-4xl">Pagina nu a fost găsită</h1>
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
        Adresa introdusă nu corespunde unei pagini publice disponibile.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/magazin"
          className="micro border border-foreground bg-foreground px-6 py-3 text-background"
        >
          Înapoi la magazin
        </Link>
        <Link to="/contact" className="micro border border-foreground px-6 py-3">
          Contact
        </Link>
      </div>
    </main>
  );
}
