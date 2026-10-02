import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminProducts } from "@/lib/admin-data";
import { fetchCategoryMemberships } from "@/lib/products";
import { sortCategoryProducts } from "@/lib/category-sorting";
import { imageUrl } from "@/lib/images";
import { primaryImage, type Category } from "@/lib/shop-types";

const EMPTY_MEMBERSHIPS: Awaited<ReturnType<typeof fetchCategoryMemberships>>["memberships"] = [];

export function CategoryProductOrder({ categories }: { categories: Category[] }) {
  const qc = useQueryClient();
  const [categoryId, setCategoryId] = useState("");
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { data: products, isLoading: productsLoading, error: productsError } = useAdminProducts();
  const membershipsQuery = useQuery({
    queryKey: ["admin", "category-order", categoryId],
    enabled: !!categoryId,
    queryFn: () => fetchCategoryMemberships(categoryId),
  });

  useEffect(() => {
    if (!categories.some((category) => category.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? "");
    }
  }, [categories, categoryId]);

  const memberships = membershipsQuery.data?.memberships ?? EMPTY_MEMBERSHIPS;
  const ordered = useMemo(() => {
    const ids = new Set(memberships.map((membership) => membership.product_id));
    return sortCategoryProducts(
      (products ?? []).filter((product) => ids.has(product.id)),
      memberships,
    );
  }, [products, memberships]);
  const savedIds = useMemo(() => ordered.map((product) => product.id), [ordered]);
  useEffect(() => setDraftIds(savedIds), [categoryId, savedIds]);

  const byId = new Map(ordered.map((product) => [product.id, product]));
  const changed = draftIds.some((id, index) => id !== savedIds[index]);
  const missing = memberships.length - ordered.length;

  function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= draftIds.length) return;
    const next = [...draftIds];
    const current = next[index];
    const replacement = next[other];
    if (!current || !replacement) return;
    next[index] = replacement;
    next[other] = current;
    setDraftIds(next);
  }

  async function save() {
    if (!categoryId || !changed || !membershipsQuery.data?.orderingAvailable || missing) return;
    setSaving(true);
    const { error } = await supabase.rpc("reorder_category_products", {
      p_category_id: categoryId,
      p_product_ids: draftIds,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      void membershipsQuery.refetch();
      return;
    }
    toast.success("Ordinea implicită a fost salvată.");
    void qc.invalidateQueries({ queryKey: ["admin", "category-order", categoryId] });
    void qc.invalidateQueries({ queryKey: ["products", "category", categoryId] });
  }

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="display text-xl">Ordinea implicită a produselor</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Pozițiile se salvează separat pentru fiecare categorie. Un produs nou, încă neordonat, apare
        după cele ordonate.
      </p>
      <label className="mt-5 block max-w-sm">
        <span className="micro-sm text-muted-foreground">Categorie</span>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {productsLoading || membershipsQuery.isLoading ? (
        <p className="py-8 text-sm text-muted-foreground">Se încarcă produsele…</p>
      ) : productsError || membershipsQuery.error ? (
        <p className="py-8 text-sm text-destructive" role="alert">
          Ordinea produselor nu a putut fi încărcată.
        </p>
      ) : !membershipsQuery.data?.orderingAvailable ? (
        <p className="py-8 text-sm text-muted-foreground">
          Migrarea pentru sortarea pe categorie nu este încă aplicată. Catalogul public rămâne
          disponibil; aplică migrarea înainte de a salva poziții.
        </p>
      ) : missing > 0 ? (
        <p className="py-8 text-sm text-destructive" role="alert">
          {missing} relații nu au un produs accesibil. Verifică integritatea datelor înainte de
          salvare.
        </p>
      ) : draftIds.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">
          Nu există produse în această categorie.
        </p>
      ) : (
        <>
          <ol className="mt-5 divide-y divide-border border-y border-border">
            {draftIds.map((id, index) => {
              const product = byId.get(id);
              if (!product) return null;
              return (
                <li key={id} className="flex items-center gap-3 py-3">
                  <span className="w-8 text-center text-sm tabular-nums">{index + 1}</span>
                  <div className="size-12 shrink-0 bg-field p-1">
                    {primaryImage(product) ? (
                      <img
                        src={imageUrl(primaryImage(product)?.url) ?? ""}
                        alt=""
                        className="size-full object-contain"
                      />
                    ) : null}
                  </div>
                  <span className="min-w-0 flex-1 text-sm">
                    {product.name}
                    {product.sku ? (
                      <small className="ml-2 text-muted-foreground">{product.sku}</small>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    aria-label={`Mută ${product.name} în sus`}
                    disabled={index === 0 || saving}
                    onClick={() => move(index, -1)}
                    className="micro-sm px-2 py-1 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Mută ${product.name} în jos`}
                    disabled={index === draftIds.length - 1 || saving}
                    onClick={() => move(index, 1)}
                    className="micro-sm px-2 py-1 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            disabled={!changed || saving}
            onClick={() => void save()}
            className="micro mt-5 border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
          >
            {saving ? "Se salvează…" : "Salvează ordinea"}
          </button>
        </>
      )}
    </section>
  );
}
