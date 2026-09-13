import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useCategories, useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";

export function SiteHeader() {
  const { count } = useCart();
  const { data: categories } = useCategories();
  const { data: content } = useContent();
  const [open, setOpen] = useState(false);

  const company = content?.["company"];
  const name = text(company, "name") ?? "Lumea Pungilor";
  const logo = imageUrl(text(company, "logo_url"));

  const nav = (categories ?? []).map((c) => (
    <Link
      key={c.id}
      to="/categorie/$slug"
      params={{ slug: c.slug }}
      className="micro link-underline"
      onClick={() => setOpen(false)}
    >
      {c.name}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="site-container grid h-14 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
        <div className="flex min-w-0 items-center gap-[clamp(18px,1.8vw,32px)]">
          <button
            type="button"
            aria-label="Deschide meniul"
            className="micro shrink-0 lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <nav className="hidden min-w-0 items-center gap-[clamp(18px,1.8vw,32px)] whitespace-nowrap lg:flex">
            <Link to="/produse" className="micro shrink-0 link-underline">
              Catalog
            </Link>
            {nav}
          </nav>
        </div>

        <Link to="/" className="flex shrink-0 items-center justify-center" aria-label={name}>
          {logo ? (
            <img src={logo} alt={name} className="h-6 w-auto object-contain" />
          ) : (
            <span className="micro text-[0.75rem] tracking-[0.28em]">{name.toUpperCase()}</span>
          )}
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-[clamp(18px,1.8vw,32px)] whitespace-nowrap">
          <Link to="/produse" aria-label="Caută" className="hidden shrink-0 lg:block">
            <Search className="size-4" />
          </Link>
          <Link to="/cos" className="micro shrink-0 link-underline">
            Coș ({count})
          </Link>
        </div>
      </div>

      {open ? (
        <nav className="site-container flex flex-col gap-4 py-5 lg:hidden">
          <Link to="/produse" className="micro" onClick={() => setOpen(false)}>
            Catalog
          </Link>
          {nav}
        </nav>
      ) : null}
    </header>
  );
}
