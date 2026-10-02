import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminProducts } from "@/lib/admin-data";
import { useCategories } from "@/lib/content";

type SeoRow = {
  id: string;
  name: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
};

function BulkRow({ row, table }: { row: SeoRow; table: "products" | "categories" }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(row.meta_title ?? "");
  const [description, setDescription] = useState(row.meta_description ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(row.meta_title ?? "");
    setDescription(row.meta_description ?? "");
  }, [row.meta_description, row.meta_title]);

  return (
    <tr className="border-t border-border align-top">
      <td className="p-3 text-sm">
        <span className="font-medium">{row.name}</span>
        <span className="mt-1 block text-xs text-muted-foreground">/{row.slug}</span>
      </td>
      <td className="p-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full border border-input bg-background px-2 py-2 text-sm"
        />
        <span className="text-xs text-muted-foreground">{title.length}/60</span>
      </td>
      <td className="p-3">
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full border border-input bg-background px-2 py-2 text-sm"
        />
        <span className="text-xs text-muted-foreground">{description.length}/155</span>
      </td>
      <td className="p-3">
        <button
          type="button"
          disabled={busy}
          className="micro-sm border border-foreground px-3 py-2 disabled:opacity-40"
          onClick={async () => {
            setBusy(true);
            const { error } = await supabase
              .from(table)
              .update({
                meta_title: title.trim() || null,
                meta_description: description.trim() || null,
              })
              .eq("id", row.id);
            setBusy(false);
            if (error) {
              toast.error(error.message);
              return;
            }
            toast.success("Metadatele au fost salvate.");
            await queryClient.invalidateQueries({
              queryKey: table === "products" ? ["admin", "products"] : ["categories"],
            });
          }}
        >
          {busy ? "Se salvează…" : "Salvează"}
        </button>
      </td>
    </tr>
  );
}

function BulkTable({
  title,
  rows,
  table,
}: {
  title: string;
  rows: SeoRow[];
  table: "products" | "categories";
}) {
  const duplicateTitles = new Set(
    rows
      .map((row) => row.meta_title?.trim().toLocaleLowerCase("ro") ?? "")
      .filter((value, index, all) => value && all.indexOf(value) !== index),
  );
  const duplicateDescriptions = new Set(
    rows
      .map((row) => row.meta_description?.trim().toLocaleLowerCase("ro") ?? "")
      .filter((value, index, all) => value && all.indexOf(value) !== index),
  );
  return (
    <section className="mt-10">
      <h2 className="display text-2xl">{title}</h2>
      {duplicateTitles.size || duplicateDescriptions.size ? (
        <p className="mt-2 text-xs text-amber-700">
          Avertisment: există {duplicateTitles.size} titluri și {duplicateDescriptions.size}{" "}
          descrieri SEO duplicate. Salvarea nu este blocată.
        </p>
      ) : null}
      <div className="mt-4 overflow-x-auto border border-border">
        <table className="w-full min-w-[850px] table-fixed">
          <thead className="bg-field text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3">Pagină</th>
              <th className="p-3">Titlu SEO</th>
              <th className="p-3">Descriere SEO</th>
              <th className="w-28 p-3">Acțiune</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <BulkRow key={row.id} row={row} table={table} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SeoBulkPanel() {
  const { data: products } = useAdminProducts();
  const { data: categories } = useCategories(true);
  const redirects = useQuery({
    queryKey: ["admin", "seo-redirects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_redirects")
        .select("from_path,to_path,entity_type,created_at")
        .order("created_at", { ascending: false });
      if (error) {
        if (["42P01", "PGRST205"].includes(error.code)) return [];
        throw error;
      }
      return data ?? [];
    },
  });
  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="display text-3xl">SEO produse și categorii</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Editor rapid pentru metadate. Prețurile, stocul și adresele paginilor nu sunt editate aici.
      </p>
      <BulkTable title="Produse" rows={(products ?? []) as SeoRow[]} table="products" />
      <BulkTable title="Categorii" rows={(categories ?? []) as SeoRow[]} table="categories" />
      <section className="mt-12">
        <h2 className="display text-2xl">Redirecturi permanente</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sunt create automat când adresa unui produs publicat sau a unei categorii vizibile se
          schimbă.
        </p>
        <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
          {(redirects.data ?? []).map((item) => (
            <li key={item.from_path} className="grid gap-1 py-3 md:grid-cols-2">
              <code>{item.from_path}</code>
              <code>→ {item.to_path}</code>
            </li>
          ))}
          {redirects.data?.length === 0 ? (
            <li className="py-5 text-muted-foreground">Nu există redirecturi salvate.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
