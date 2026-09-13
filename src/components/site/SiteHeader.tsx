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
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 md:px-8">
        <div className="flex flex-1 items-center gap-6">
          <button
            type="button"
            aria-label="Deschide meniul"
            className="micro md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/produse" className="micro link-underline">
              Catalog
            </Link>
            {nav}
          </nav>
        </div>

        <Link to="/" className="flex items-center justify-center" aria-label={name}>
          {logo ? (
            <img src={logo} alt={name} className="h-6 w-auto object-contain" />
          ) : (
            <span className="micro text-[0.75rem] tracking-[0.28em]">{name.toUpperCase()}</span>
          )}
        </Link>

        <div className="flex flex-1 items-center justify-end gap-5">
          <Link to="/produse" aria-label="Caută" className="hidden md:block">
            <Search className="size-4" />
          </Link>
          <Link to="/cos" className="micro link-underline">
            Coș ({count})
          </Link>
        </div>
      </div>

      {open ? (
        <nav className="flex flex-col gap-4 border-t border-border px-4 py-5 md:hidden">
          <Link to="/produse" className="micro" onClick={() => setOpen(false)}>
            Catalog
          </Link>
          {nav}
        </nav>
      ) : null}
    </header>
  );
}
