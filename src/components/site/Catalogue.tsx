import { useMemo, useState } from "react";
import { usePublishedProducts } from "@/lib/products";
import { useCategories } from "@/lib/content";
import { ProductCard } from "@/components/site/ProductCard";
import type { Product } from "@/lib/shop-types";

type Sort = "recent" | "pret-asc" | "pret-desc" | "nume";

function specValues(products: Product[], label: string): string[] {
  const set = new Set<string>();
  for (const p of products) {
    for (const s of p.specs) {
      if (s.label.trim().toLowerCase() === label) set.add(s.value.trim());
    }
  }
  return [...set].sort();
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
  const { data: all, isLoading, error } = usePublishedProducts();
  const { data: categories } = useCategories();
  const [panelOpen, setPanelOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("");
  const [material, setMaterial] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<Sort>("recent");

  const scoped = useMemo(() => {
    const list = all ?? [];
    return categorySlug ? list.filter((p) => p.categories?.slug === categorySlug) : list;
  }, [all, categorySlug]);

  const materials = useMemo(() => specValues(scoped, "material"), [scoped]);
  const sizes = useMemo(() => specValues(scoped, "dimensiuni"), [scoped]);

  const filtered = useMemo(() => {
    let list = [...scoped];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.sku ?? "").toLowerCase().includes(q),
      );
    }
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

  const activeFilters = [cat, material, size, maxPrice, inStockOnly ? "1" : ""].filter(Boolean).length;

  function resetFilters() {
    setCat("");
    setMaterial("");
    setSize("");
    setMaxPrice("");
    setInStockOnly(false);
    setQuery("");
  }

  return (
    <div className="site-container py-14">
      <h1 className="display text-3xl md:text-4xl">{title}</h1>
      {intro ? <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{intro}</p> : null}

      <div className="mt-10 flex items-center justify-between border-b border-border pb-3">
        <button
          type="button"
          className="micro link-underline"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((v) => !v)}
        >
          Filtrează și sortează{activeFilters ? ` (${activeFilters})` : ""}
        </button>
        <span className="micro-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "produs" : "produse"}
        </span>
      </div>

      {panelOpen ? (
        <div className="grid gap-6 border-b border-border py-8 md:grid-cols-3 lg:grid-cols-6">
          <label className="block">
            <span className="micro-sm text-muted-foreground">Caută</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="Nume sau cod"
            />
          </label>

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

      {isLoading ? (
        <p className="py-24 text-center text-sm text-muted-foreground">Se încarcă…</p>
      ) : error ? (
        <p className="py-24 text-center text-sm text-muted-foreground">
          Produsele nu au putut fi încărcate.
        </p>
      ) : scoped.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">
          Catalogul este în pregătire. Produsele vor apărea aici în curând.
        </p>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-muted-foreground">Niciun produs nu corespunde filtrelor alese.</p>
          <button type="button" onClick={resetFilters} className="micro mt-6 link-underline">
            Resetează filtrele
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-x-[clamp(16px,2vw,32px)] gap-y-12">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
