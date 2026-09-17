import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useCategories, useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";

export function SiteHeader() {
  const auth = useAuth();
  const { count } = useCart();
  const { data: categories } = useCategories();
  const { data: content } = useContent();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let scheduled = false;
    const update = () => {
      setCompact(window.scrollY > 72);
      scheduled = false;
    };
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header
      className={cn(
        "site-header sticky top-0 z-40 border-b",
        compact ? "is-compact border-foreground/10 bg-background/90 backdrop-blur-[10px]" : "border-border bg-background",
      )}
    >
      <div className="site-header-inner site-container grid h-14 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 lg:flex">
        <div className="flex min-w-0 items-center gap-[clamp(18px,1.8vw,32px)] lg:shrink-0">
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

        <Link to="/" className="flex shrink-0 items-center justify-center lg:ml-1" aria-label={name}>
          {logo ? (
            <img src={logo} alt={name} className="h-6 w-auto object-contain" />
          ) : (
            <span className="micro text-[0.75rem] tracking-[0.28em]">{name.toUpperCase()}</span>
          )}
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-[clamp(18px,1.8vw,32px)] whitespace-nowrap lg:ml-auto">
          <Link to="/produse" aria-label="Caută" className="hidden shrink-0 lg:block">
            <Search className="size-4" />
          </Link>
          {auth.user ? (
            <Link to="/cont" className="micro hidden shrink-0 link-underline sm:block">
              Contul meu
            </Link>
          ) : (
            <Link to="/" hash="cont" className="micro hidden shrink-0 link-underline sm:block">
              Cont
            </Link>
          )}
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
