import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { usePublishedProducts } from "@/lib/products";
import { useCategories } from "@/lib/content";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { matchesQuery } from "@/lib/search";
import type { Product } from "@/lib/shop-types";

type Sort = "recent" | "pret-asc" | "pret-desc" | "nume";

const PAGE_SIZE = 24;

function ProductCardSkeleton() {
  return (
    <div className="flex h-full animate-pulse flex-col" aria-hidden="true">
      <div className="h-[10.75rem] w-full bg-field min-[480px]:h-[12rem] md:h-[13rem] lg:h-[14.5rem] xl:h-[15rem] min-[1600px]:h-[15.5rem]" />
      <div className="mt-3 flex flex-1 flex-col gap-2">
        <div className="h-2.5 w-1/3 bg-muted" />
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-muted" />
          <div className="h-3.5 w-2/3 bg-muted" />
        </div>
        <div className="mt-auto space-y-2 pt-4">
          <div className="h-2.5 w-1/4 bg-muted" />
          <div className="h-4 w-2/5 bg-muted" />
        </div>
      </div>
    </div>
  );
}

function specValues(products: Product[], label: string): string[] {
  const set = new Set<string>();
  for (const p of products) {
    for (const s of p.specs) {
      if (s.label.trim().toLowerCase() === label) set.add(s.value.trim());
    }
  }
  return [...set].sort();
}

/** Everything a customer might type: name, code and dimensions. */
function searchIndex(p: Product): string {
  return [
    p.name,
    p.sku ?? "",
    p.description ?? "",
    p.categories?.name ?? "",
    ...p.specs.map((s) => `${s.label} ${s.value}`),
  ].join(" ");
}

export function Catalogue({
  categorySlug,
  title,
  intro,
}: {
  categorySlug?: string;
  title: string;
  intro?: string | null;
}) {
  const { data: all, isLoading, error, refetch, isFetching } = usePublishedProducts();
  const { data: categories } = useCategories();
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("");
  const [material, setMaterial] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<Sort>("recent");
  const searchRef = useRef<HTMLInputElement>(null);

  const positionKey = `lp-catalog-shown:${categorySlug ?? "toate"}`;
  const [shown, setShown] = useState(PAGE_SIZE);

  // Restore how much of the list was open before visiting a product page.
  useEffect(() => {
    const saved = Number(window.sessionStorage.getItem(positionKey));
    if (Number.isFinite(saved) && saved > PAGE_SIZE) setShown(saved);
  }, [positionKey]);

  useEffect(() => {
    window.sessionStorage.setItem(positionKey, String(shown));
  }, [positionKey, shown]);

  const scoped = useMemo(() => {
    const list = all ?? [];
    return categorySlug ? list.filter((p) => p.categories?.slug === categorySlug) : list;
  }, [all, categorySlug]);

  const materials = useMemo(() => specValues(scoped, "material"), [scoped]);
  const sizes = useMemo(() => specValues(scoped, "dimensiuni"), [scoped]);

  const filtered = useMemo(() => {
    let list = [...scoped];
    const q = query.trim();
    if (q) list = list.filter((p) => matchesQuery(searchIndex(p), q));
    if (cat) list = list.filter((p) => p.categories?.slug === cat);
    if (material)
      list = list.filter((p) =>
        p.specs.some((s) => s.label.trim().toLowerCase() === "material" && s.value.trim() === material),
      );
    if (size)
      list = list.filter((p) =>
        p.specs.some((s) => s.label.trim().toLowerCase() === "dimensiuni" && s.value.trim() === size),
      );
    if (inStockOnly) list = list.filter((p) => !p.track_stock || p.stock > 0);
    const max = Number(maxPrice);
    if (maxPrice !== "" && Number.isFinite(max)) list = list.filter((p) => Number(p.price) <= max);

    switch (sort) {
      case "pret-asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "pret-desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "nume":
        list.sort((a, b) => a.name.localeCompare(b.name, "ro"));
        break;
      default:
        break;
    }
    return list;
  }, [scoped, query, cat, material, size, inStockOnly, maxPrice, sort]);

  // A new search or filter always starts from the first page.
  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [query, cat, material, size, inStockOnly, maxPrice, sort]);

  const visible = filtered.slice(0, shown);
  const activeFilters = [cat, material, size, maxPrice, inStockOnly ? "1" : ""].filter(Boolean).length;

  function resetFilters() {
    setCat("");
    setMaterial("");
    setSize("");
    setMaxPrice("");
    setInStockOnly(false);
    setQuery("");
  }

  const searchField = (
    <div className="relative w-full md:w-[22rem]">
      <label htmlFor="catalog-search" className="sr-only">
        Caută în catalog după nume, cod sau dimensiuni
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id="catalog-search"
        ref={searchRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setQuery("");
        }}
        placeholder="Caută: nume, cod sau dimensiuni"
        className="min-h-11 w-full border border-input bg-background pl-9 pr-10 text-sm outline-none focus:border-foreground"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            searchRef.current?.focus();
          }}
          aria-label="Șterge căutarea"
          className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="catalogue-container py-14">
      <h1 className="display text-3xl md:text-4xl">{title}</h1>
      {intro ? <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{intro}</p> : null}

      <div className="mt-8 hidden md:block">{searchField}</div>

      <div className="mt-4 md:hidden">
        {mobileSearchOpen ? (
          searchField
        ) : (
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(true);
              window.setTimeout(() => searchRef.current?.focus(), 0);
            }}
            className="micro flex min-h-11 w-full items-center justify-center gap-2 border border-foreground px-4"
          >
            <Search className="size-4" aria-hidden="true" />
            Caută în catalog
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-b border-border pb-3">
        <button
          type="button"
          className="micro link-underline min-h-11"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((v) => !v)}
        >
          Filtrează și sortează{activeFilters ? ` (${activeFilters})` : ""}
        </button>
        {!isLoading && !error ? (
          <span className="micro-sm text-muted-foreground" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "produs" : "produse"}
          </span>
        ) : null}
      </div>

      {panelOpen ? (
        <div className="grid gap-6 border-b border-border py-8 md:grid-cols-3 lg:grid-cols-6">
          {!categorySlug ? (
            <label className="block">
              <span className="micro-sm text-muted-foreground">Categorie</span>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="">Toate</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {materials.length > 0 ? (
            <label className="block">
              <span className="micro-sm text-muted-foreground">Material</span>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="">Toate</option>
                {materials.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {sizes.length > 0 ? (
            <label className="block">
              <span className="micro-sm text-muted-foreground">Dimensiuni</span>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="">Toate</option>
                {sizes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="micro-sm text-muted-foreground">Preț maxim (RON)</span>
            <input
              value={maxPrice}
              inputMode="decimal"
              onChange={(e) => setMaxPrice(e.target.value)}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>

          <label className="block">
            <span className="micro-sm text-muted-foreground">Sortare</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="recent">Recomandate</option>
              <option value="pret-asc">Preț crescător</option>
              <option value="pret-desc">Preț descrescător</option>
              <option value="nume">Alfabetic</option>
            </select>
          </label>

          <label className="flex items-center gap-2 self-end">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="size-4 accent-foreground"
            />
            <span className="micro-sm">Doar în stoc</span>
          </label>

          <button type="button" onClick={resetFilters} className="micro-sm self-end text-left link-underline">
            Resetează filtrele
          </button>
        </div>
      ) : null}

      {isLoading || (isFetching && (all ?? []).length === 0) ? (
        <div
          className="product-grid mt-8 motion-reduce:[&>*]:animate-none"
          aria-label="Produsele se încarcă"
          aria-busy="true"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="py-24 text-center" role="alert">
          <p className="text-sm text-muted-foreground">
            Produsele nu au putut fi încărcate. Te rugăm să încerci din nou.
          </p>
          <Button
            type="button"
            variant="outline"
            className="micro mt-6 rounded-none"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? "Se reîncearcă…" : "Încearcă din nou"}
          </Button>
        </div>
      ) : scoped.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">
          Catalogul este în pregătire. Produsele vor apărea aici în curând.
        </p>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-muted-foreground">
            {query.trim()
              ? `Niciun produs nu corespunde căutării „${query.trim()}”.`
              : "Niciun produs nu corespunde filtrelor alese."}
          </p>
          <button type="button" onClick={resetFilters} className="micro mt-6 min-h-11 link-underline">
            Resetează căutarea și filtrele
          </button>
        </div>
      ) : (
        <>
          <div className="product-grid mt-8">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {filtered.length > visible.length ? (
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={() => setShown((s) => s + PAGE_SIZE)}
                className="micro min-h-11 border border-foreground px-8 py-3 transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                Încarcă mai multe
              </button>
              <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
                {visible.length} din {filtered.length} produse afișate
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
