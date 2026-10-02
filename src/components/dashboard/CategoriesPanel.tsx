import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/lib/content";
import { slugify } from "@/lib/format";
import { uploadProductImage } from "@/lib/admin-data";
import { imageUrl } from "@/lib/images";
import { categoryRouteSlug } from "@/lib/sitemap";
import type { Category } from "@/lib/shop-types";
import { CategoryProductOrder } from "@/components/dashboard/CategoryProductOrder";
import {
  duplicateSeoWarning,
  HeadingOutline,
  SeoField,
  SeoPreview,
} from "@/components/dashboard/SeoEditorTools";

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  intro_text: string;
  body_text: string;
  meta_title: string;
  meta_description: string;
  image_url: string | null;
  sort_order: number;
  is_visible: boolean;
};

const blank: Draft = {
  name: "",
  slug: "",
  description: "",
  intro_text: "",
  body_text: "",
  meta_title: "",
  meta_description: "",
  image_url: null,
  sort_order: 0,
  is_visible: true,
};

export function CategoriesPanel() {
  const qc = useQueryClient();
  const { data: categories, isLoading } = useCategories(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [slugEditable, setSlugEditable] = useState(true);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Numele categoriei este obligatoriu.");
      return;
    }
    setBusy(true);
    const payload = {
      name: draft.name.trim(),
      slug: categoryRouteSlug(draft.slug.trim() || slugify(draft.name)).toLowerCase(),
      description: draft.description.trim() || null,
      intro_text: draft.intro_text.trim() || null,
      body_text: draft.body_text.trim() || null,
      meta_title: draft.meta_title.trim() || null,
      meta_description: draft.meta_description.trim() || null,
      image_url: draft.image_url,
      sort_order: draft.sort_order,
      is_visible: draft.is_visible,
    };
    const { error } = draft.id
      ? await supabase.from("categories").update(payload).eq("id", draft.id)
      : await supabase.from("categories").insert(payload);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Categorie salvată.");
    setDraft(null);
    invalidate();
  }

  async function remove(cat: Category) {
    if (!confirm(`Ștergi categoria „${cat.name}”? Produsele rămân, dar fără categorie.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Categorie ștearsă.");
    invalidate();
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display text-3xl">Categorii</h1>
        <button
          type="button"
          onClick={() => {
            setSlugEditable(true);
            setDraft({ ...blank, sort_order: (categories ?? []).length });
          }}
          className="micro border border-foreground bg-foreground px-6 py-3 text-background"
        >
          Categorie nouă
        </button>
      </div>

      {draft ? (
        <div className="mt-8 space-y-5 border border-border p-6">
          <label className="block">
            <span className="micro-sm text-muted-foreground">Nume *</span>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="micro-sm text-muted-foreground">
              Adresă în link (se completează automat)
            </span>
            <input
              value={draft.slug}
              placeholder={slugify(draft.name)}
              disabled={!!draft.id && !slugEditable}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground disabled:opacity-60"
            />
            {draft.id && !slugEditable ? (
              <button
                type="button"
                className="micro-sm mt-2 link-underline"
                onClick={() => {
                  if (
                    confirm(
                      "Schimbarea adresei modifică URL-ul public. Vechea adresă va primi redirect permanent. Continui?",
                    )
                  )
                    setSlugEditable(true);
                }}
              >
                Editează adresa
              </button>
            ) : null}
          </label>
          <label className="block">
            <span className="micro-sm text-muted-foreground">Descriere</span>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="micro-sm text-muted-foreground">Introducere categorie</span>
            <textarea
              rows={3}
              value={draft.intro_text}
              onChange={(e) => setDraft({ ...draft, intro_text: e.target.value })}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="micro-sm text-muted-foreground">
              Conținut după produse (Markdown H2/H3)
            </span>
            <textarea
              rows={7}
              value={draft.body_text}
              onChange={(e) => setDraft({ ...draft, body_text: e.target.value })}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <SeoField
              label="Titlu SEO"
              value={draft.meta_title}
              target={60}
              onChange={(value) => setDraft({ ...draft, meta_title: value })}
            />
            <SeoField
              label="Descriere SEO"
              value={draft.meta_description}
              target={155}
              multiline
              onChange={(value) => setDraft({ ...draft, meta_description: value })}
            />
          </div>
          {["meta_title", "meta_description"].map((field) => {
            const warning = duplicateSeoWarning(
              draft.id,
              field as "meta_title" | "meta_description",
              draft[field as "meta_title"],
              (categories ?? []).map((category) => ({ ...category, name: category.name })),
            );
            return warning ? (
              <p key={field} className="text-xs text-amber-700">
                {warning}
              </p>
            ) : null;
          })}
          <div className="grid gap-4 md:grid-cols-2">
            <SeoPreview
              title={draft.meta_title}
              fallbackTitle={`${draft.name || "Categorie"} — Lumea Pungilor`}
              url={`https://lumeapungilor.ro/categorie/${categoryRouteSlug(draft.slug || slugify(draft.name))}`}
              description={draft.meta_description}
              fallbackDescription={draft.intro_text || draft.description}
            />
            <HeadingOutline h1={draft.name} markdown={draft.body_text} />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="block">
              <span className="micro-sm text-muted-foreground">Ordine</span>
              <input
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
                className="mt-2 w-24 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </label>
            <label className="flex items-center gap-2 self-end">
              <input
                type="checkbox"
                checked={draft.is_visible}
                onChange={(e) => setDraft({ ...draft, is_visible: e.target.checked })}
                className="size-4 accent-foreground"
              />
              <span className="micro-sm">Vizibilă pe site</span>
            </label>
          </div>
          <div>
            <span className="micro-sm text-muted-foreground">Fotografie</span>
            <div className="mt-2 flex items-center gap-4">
              {draft.image_url ? (
                <img
                  src={imageUrl(draft.image_url) ?? ""}
                  alt=""
                  className="size-24 bg-field object-contain p-2"
                />
              ) : null}
              <input
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const path = await uploadProductImage(file, draft.slug || draft.name);
                    setDraft({ ...draft, image_url: path });
                    toast.success("Fotografie încărcată.");
                  } catch {
                    toast.error("Fotografia nu a putut fi încărcată.");
                  }
                }}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="micro border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
            >
              Salvează
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="micro border border-foreground px-6 py-3"
            >
              Renunță
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="py-16 text-sm text-muted-foreground">Se încarcă…</p>
      ) : (categories ?? []).length === 0 ? (
        <p className="py-16 text-sm text-muted-foreground">Nu există încă nicio categorie.</p>
      ) : (
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {(categories ?? []).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="size-14 shrink-0 bg-field p-1">
                {c.image_url ? (
                  <img
                    src={imageUrl(c.image_url) ?? ""}
                    alt=""
                    className="size-full object-contain"
                  />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="text-sm">{c.name}</p>
                <p className="micro-sm text-muted-foreground">
                  /{categoryRouteSlug(c.slug)} · {c.is_visible ? "vizibilă" : "ascunsă"}
                </p>
              </div>
              <button
                type="button"
                className="micro-sm link-underline"
                onClick={() => {
                  setSlugEditable(false);
                  setDraft({
                    id: c.id,
                    name: c.name,
                    slug: categoryRouteSlug(c.slug),
                    description: c.description ?? "",
                    intro_text: c.intro_text ?? "",
                    body_text: c.body_text ?? "",
                    meta_title: c.meta_title ?? "",
                    meta_description: c.meta_description ?? "",
                    image_url: c.image_url,
                    sort_order: c.sort_order,
                    is_visible: c.is_visible,
                  });
                }}
              >
                Editează
              </button>
              <button type="button" className="micro-sm link-underline" onClick={() => remove(c)}>
                Șterge
              </button>
            </li>
          ))}
        </ul>
      )}
      <CategoryProductOrder categories={categories ?? []} />
    </div>
  );
}
