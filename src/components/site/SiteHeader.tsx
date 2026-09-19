import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { companyInfo } from "@/lib/company";
import { useCategories, useContent } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";

export function SiteHeader() {
  const auth = useAuth();
  const { count } = useCart();
  const { data: categories } = useCategories();
  const { data: content } = useContent();
  const [menuOpen, setMenuOpen] = useState(false);
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

  const name = companyInfo(content).brandName ?? "Lumea Pungilor";
  const accountDestination = auth.user ? "/cont" : "/";

  const desktopCategories = (categories ?? []).map((c) => (
    <Link
      key={c.id}
      to="/categorie/$slug"
      params={{ slug: c.slug }}
      className="link-underline shrink-0 text-[0.8125rem] font-medium uppercase leading-none tracking-[0.08em] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
      activeProps={{ className: "bg-[length:100%_1px]" }}
    >
      {c.name}
    </Link>
  ));

  const drawerCategories = (categories ?? []).map((c) => (
    <SheetClose asChild key={c.id}>
      <Link
        to="/categorie/$slug"
        params={{ slug: c.slug }}
        className="border-b border-border py-4 text-sm font-medium uppercase tracking-[0.08em] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {c.name}
      </Link>
    </SheetClose>
  ));

  return (
    <header
      className={cn(
        "site-header sticky top-0 z-40 border-b border-border bg-background",
        compact && "is-compact border-foreground/10 bg-background/90 backdrop-blur-[10px]",
      )}
    >
      <div className="utility-bar hidden h-8 bg-muted/70 min-[769px]:block">
        <div className="mx-auto flex h-full w-full max-w-[110rem] items-center justify-end gap-6 px-[clamp(20px,3vw,56px)]">
          <Link to="/contact" className="text-[0.6875rem] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Contact
          </Link>
          <Link to="/ajutor-comanda" className="text-[0.6875rem] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Ajutor
          </Link>
          <Link
            to={accountDestination}
            hash={auth.user ? undefined : "cont"}
            className="text-[0.6875rem] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Contul meu
          </Link>
        </div>
      </div>

      <div className="site-header-inner mx-auto grid h-[3.75rem] w-full max-w-[110rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-[clamp(20px,3vw,56px)] min-[769px]:h-[4.5rem] min-[1100px]:grid-cols-[minmax(15rem,1fr)_auto_minmax(15rem,1fr)] min-[1100px]:gap-[clamp(24px,2.5vw,48px)]">
        <div className="min-[1100px]:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 size-11" aria-label="Deschide meniul de navigare">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,24rem)] border-border p-0 shadow-none">
              <SheetHeader className="border-b border-border px-6 py-6 text-left">
                <SheetTitle className="pr-8 text-lg font-semibold uppercase tracking-[0.04em]">{name}</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navigare principală" className="flex flex-col px-6 py-3">
                <SheetClose asChild>
                  <Link to="/produse" className="border-b border-border py-4 text-sm font-medium uppercase tracking-[0.08em] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                    Catalog
                  </Link>
                </SheetClose>
                {drawerCategories}
              </nav>
              <div className="mt-4 flex flex-col border-t border-border px-6 py-3">
                <SheetClose asChild>
                  <Link to="/contact" className="py-3 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Contact</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/ajutor-comanda" className="py-3 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ajutor</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to={accountDestination} hash={auth.user ? undefined : "cont"} className="flex min-h-11 items-center gap-2 text-sm font-medium uppercase tracking-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <UserRound className="size-4" aria-hidden="true" />
                    Contul meu
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Link
          to="/"
          className="min-w-0 justify-self-start whitespace-nowrap text-[clamp(1rem,3.8vw,1.25rem)] font-semibold uppercase leading-none tracking-[0.035em] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 min-[769px]:text-[1.35rem] min-[1100px]:text-[clamp(1.5rem,1.8vw,1.75rem)]"
          aria-label={`${name} — pagina principală`}
        >
          {name.toUpperCase()}
        </Link>

        <nav aria-label="Categorii produse" className="hidden items-center justify-center gap-[clamp(16px,1.65vw,30px)] whitespace-nowrap min-[1100px]:flex">
          <Link
            to="/produse"
            className="link-underline shrink-0 text-[0.8125rem] font-medium uppercase leading-none tracking-[0.08em] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
            activeProps={{ className: "bg-[length:100%_1px]" }}
          >
            Catalog
          </Link>
          {desktopCategories}
        </nav>

        <div className="flex items-center justify-end gap-1 whitespace-nowrap min-[769px]:gap-[clamp(12px,1.5vw,24px)]">
          <Link to="/produse" aria-label="Caută produse" className="grid size-11 shrink-0 place-items-center outline-none hover:opacity-60 focus-visible:ring-2 focus-visible:ring-ring">
            <Search className="size-[1.125rem]" aria-hidden="true" />
          </Link>
          {auth.user ? (
            <Link to="/cont" className="link-underline hidden shrink-0 text-xs font-medium uppercase tracking-[0.08em] outline-none focus-visible:ring-2 focus-visible:ring-ring min-[1100px]:block">
              Contul meu
            </Link>
          ) : (
            <Link to="/" hash="cont" className="link-underline hidden shrink-0 text-xs font-medium uppercase tracking-[0.08em] outline-none focus-visible:ring-2 focus-visible:ring-ring min-[1100px]:block">
              Contul meu
            </Link>
          )}
          <Link to="/cos" aria-label={`Coș de cumpărături, ${count} produse`} className="flex h-11 shrink-0 items-center gap-2 px-1 text-xs font-medium uppercase tracking-[0.08em] outline-none hover:opacity-60 focus-visible:ring-2 focus-visible:ring-ring">
            <ShoppingBag className="size-[1.125rem] min-[769px]:hidden" aria-hidden="true" />
            <span className="hidden min-[769px]:inline">Coș</span>
            <span aria-hidden="true">({count})</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
