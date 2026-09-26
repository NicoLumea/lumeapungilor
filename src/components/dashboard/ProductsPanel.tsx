import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminProducts, uploadProductImage } from "@/lib/admin-data";
import { useCategories } from "@/lib/content";
import { imageUrl } from "@/lib/images";
import { formatRon, slugify } from "@/lib/format";
import { primaryImage, sortedImages, type Product, type Spec } from "@/lib/shop-types";

type ImageDraft = { id?: string; url: string; alt: string; isPrimary: boolean };
type VariantDraft = { id?: string; name: string; sku: string; price: string; stock: number };

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  sku: string;
  price: string;
  selling_unit: string;
  units_per_pack: string;
  min_order_qty: number;
  qty_increment: number;
  stock: number;
  track_stock: boolean;
  status: "draft" | "published";
  is_featured: boolean;
  is_archived: boolean;
  sort_order: number;
  specs: Spec[];
  images: ImageDraft[];
  variants: VariantDraft[];
};

const blank: Draft = {
  name: "",
  slug: "",
  description: "",
  category_id: "",
  sku: "",
  price: "",
  selling_unit: "set",
  units_per_pack: "",
  min_order_qty: 1,
  qty_increment: 1,
  stock: 0,
  track_stock: true,
  status: "draft",
  is_featured: false,
  is_archived: false,
  sort_order: 0,
  specs: [],
  images: [],
  variants: [],
};

function toDraft(p: Product): Draft {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    category_id: p.category_id ?? "",
    sku: p.sku ?? "",
    price: String(p.price),
    selling_unit: p.selling_unit,
    units_per_pack: p.units_per_pack ? String(p.units_per_pack) : "",
    min_order_qty: p.min_order_qty,
    qty_increment: p.qty_increment,
    stock: p.stock,
    track_stock: p.track_stock,
    status: p.status === "published" ? "published" : "draft",
    is_featured: p.is_featured,
    is_archived: p.is_archived,
    sort_order: p.sort_order,
    specs: p.specs ?? [],
    images: sortedImages(p).map((i) => ({
      id: i.id,
      url: i.url,
      alt: i.alt ?? "",
      isPrimary: i.is_primary,
    })),
    variants: [...(p.product_variants ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku ?? "",
        price: v.price === null ? "" : String(v.price),
        stock: v.stock,
      })),
  };
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="micro-sm text-muted-foreground">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function ProductsPanel() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useAdminProducts();
  const { data: categories } = useCategories(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const draggedImageKey = useRef<string | null>(null);
  const dragStartImages = useRef<ImageDraft[] | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  async function persistGallery(productId: string, images: ImageDraft[]) {
    const imageIds = images.map((image) => image.id).filter((id): id is string => !!id);
    if (imageIds.length !== images.length) return;
    const primaryId = images.find((image) => image.isPrimary)?.id ?? imageIds[0];
    if (!primaryId) return;
    const { error } = await supabase.rpc("update_product_image_gallery", {
      p_product_id: productId,
      p_image_ids: imageIds,
      p_primary_image_id: primaryId,
    });
    if (error) throw error;
    invalidate();
  }

  async function moveImage(from: number, to: number) {
    if (!draft || from === to || to < 0 || to >= draft.images.length) return;
    const previous = draft.images;
    const images = [...previous];
    const [moved] = images.splice(from, 1);
    if (!moved) return;
    images.splice(to, 0, moved);
    setDraft({ ...draft, images });
    if (!draft.id) return;
    try {
      await persistGallery(draft.id, images);
    } catch (error) {
      setDraft((current) => (current ? { ...current, images: previous } : current));
      toast.error(
        error instanceof Error ? error.message : "Ordinea fotografiilor nu a putut fi salvată.",
      );
    }
  }

  async function choosePrimary(index: number) {
    if (!draft || draft.images[index]?.isPrimary) return;
    const previous = draft.images;
    const images = draft.images.map((image, current) => ({
      ...image,
      isPrimary: current === index,
    }));
    setDraft({ ...draft, images });
    if (!draft.id) return;
    try {
      await persistGallery(draft.id, images);
      toast.success("Fotografia principală a fost actualizată.");
    } catch (error) {
      setDraft((current) => (current ? { ...current, images: previous } : current));
      toast.error(
        error instanceof Error ? error.message : "Fotografia principală nu a putut fi salvată.",
      );
    }
  }

  async function deleteImage(index: number) {
    if (!draft) return;
    const removed = draft.images[index];
    if (!removed) return;
    const remaining = draft.images.filter((_, current) => current !== index);
    if (removed.isPrimary && remaining[0]) remaining[0] = { ...remaining[0], isPrimary: true };
    setDraft({ ...draft, images: remaining });
    if (!draft.id || !removed.id) return;
    try {
      const { error } = await supabase.from("product_images").delete().eq("id", removed.id);
      if (error) throw error;
      if (remaining.length > 0) await persistGallery(draft.id, remaining);
      else invalidate();
    } catch (error) {
      setDraft(null);
      invalidate();
      toast.error(
        error instanceof Error
          ? `${error.message} Reîncărcăm galeria salvată.`
          : "Fotografia nu a putut fi ștearsă. Reîncărcăm galeria salvată.",
      );
    }
  }

  async function finishDrag() {
    const previous = dragStartImages.current;
    draggedImageKey.current = null;
    dragStartImages.current = null;
    if (!draft?.id || !previous || previous === draft.images) return;
    try {
      await persistGallery(draft.id, draft.images);
    } catch (error) {
      setDraft((current) => (current ? { ...current, images: previous } : current));
      toast.error(
        error instanceof Error ? error.message : "Ordinea fotografiilor nu a putut fi salvată.",
      );
    }
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Numele produsului este obligatoriu.");
      return;
    }
    const price = Number(draft.price.replace(",", "."));
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Prețul trebuie să fie un număr.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: draft.name.trim(),
        slug: (draft.slug.trim() || slugify(draft.name)).toLowerCase(),
        description: draft.description.trim() || null,
        category_id: draft.category_id || null,
        sku: draft.sku.trim() || null,
        price,
        selling_unit: draft.selling_unit.trim() || "set",
        units_per_pack: draft.units_per_pack ? Number(draft.units_per_pack) : null,
        min_order_qty: Math.max(1, draft.min_order_qty),
        qty_increment: Math.max(1, draft.qty_increment),
        stock: draft.stock,
        track_stock: draft.track_stock,
        status: draft.status,
        is_featured: draft.is_featured,
        is_archived: draft.is_archived,
        sort_order: draft.sort_order,
        specs: draft.specs.filter((s) => s.label.trim() && s.value.trim()),
      };

      let productId = draft.id;
      if (productId) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      const savedImages: ImageDraft[] = [];
      for (const [index, image] of draft.images.entries()) {
        if (image.id) {
          const { error } = await supabase
            .from("product_images")
            .update({ alt: image.alt.trim() || null })
            .eq("id", image.id);
          if (error) throw error;
          savedImages.push(image);
        } else {
          const { data, error } = await supabase
            .from("product_images")
            .insert({
              product_id: productId,
              url: image.url,
              alt: image.alt.trim() || null,
              sort_order: index,
              is_primary: false,
            })
            .select("id")
            .single();
          if (error) throw error;
          savedImages.push({ ...image, id: data.id });
        }
      }
      if (savedImages.length > 0) await persistGallery(productId, savedImages);

      await supabase.from("product_variants").delete().eq("product_id", productId);
      const variants = draft.variants.filter((v) => v.name.trim());
      if (variants.length > 0) {
        const { error } = await supabase.from("product_variants").insert(
          variants.map((v, i) => ({
            product_id: productId,
            name: v.name.trim(),
            sku: v.sku.trim() || null,
            price: v.price.trim() === "" ? null : Number(v.price.replace(",", ".")),
            stock: v.stock,
            sort_order: i,
          })),
        );
        if (error) throw error;
      }

      toast.success("Produs salvat.");
      setDraft(null);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Produsul nu a putut fi salvat.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Ștergi definitiv „${p.name}”?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Produs șters.");
    invalidate();
  }

  async function togglePublish(p: Product) {
    const status = p.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("products").update({ status }).eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "published" ? "Produs publicat." : "Produs trecut pe ciornă.");
    invalidate();
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display text-3xl">Produse</h1>
        <button
          type="button"
          onClick={() => setDraft({ ...blank })}
          className="micro border border-foreground bg-foreground px-6 py-3 text-background"
        >
          Produs nou
        </button>
      </div>

      {draft ? (
        <div className="mt-8 space-y-8 border border-border p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Text
              label="Nume *"
              value={draft.name}
              onChange={(v) => setDraft({ ...draft, name: v })}
            />
            <Text
              label="Adresă în link"
              value={draft.slug}
              placeholder={slugify(draft.name)}
              onChange={(v) => setDraft({ ...draft, slug: v })}
            />
            <label className="block">
              <span className="micro-sm text-muted-foreground">Categorie</span>
              <select
                value={draft.category_id}
                onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="">Fără categorie</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Text
              label="Cod produs"
              value={draft.sku}
              onChange={(v) => setDraft({ ...draft, sku: v })}
            />
            <Text
              label="Preț (RON) *"
              value={draft.price}
              onChange={(v) => setDraft({ ...draft, price: v })}
              hint="Prețul pentru o unitate de vânzare."
            />
            <Text
              label="Unitate de vânzare"
              value={draft.selling_unit}
              onChange={(v) => setDraft({ ...draft, selling_unit: v })}
              hint="Ex.: bucată, set, bax."
            />
            <Text
              label="Bucăți per unitate"
              value={draft.units_per_pack}
              onChange={(v) => setDraft({ ...draft, units_per_pack: v.replace(/\D/g, "") })}
              hint="Completează dacă vinzi la set sau bax; se afișează și prețul pe bucată."
            />
            <label className="block">
              <span className="micro-sm text-muted-foreground">Stare</span>
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.value === "published" ? "published" : "draft",
                  })
                }
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="draft">Ciornă (invizibil pe site)</option>
                <option value="published">Publicat</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="micro-sm text-muted-foreground">Descriere</span>
            <textarea
              rows={5}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-4">
            <label className="block">
              <span className="micro-sm text-muted-foreground">Cantitate minimă</span>
              <input
                type="number"
                min={1}
                value={draft.min_order_qty}
                onChange={(e) => setDraft({ ...draft, min_order_qty: Number(e.target.value) || 1 })}
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </label>
            <label className="block">
              <span className="micro-sm text-muted-foreground">Pas cantitate</span>
              <input
                type="number"
                min={1}
                value={draft.qty_increment}
                onChange={(e) => setDraft({ ...draft, qty_increment: Number(e.target.value) || 1 })}
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </label>
            <label className="block">
              <span className="micro-sm text-muted-foreground">Stoc</span>
              <input
                type="number"
                value={draft.stock}
                onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) || 0 })}
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </label>
            <label className="block">
              <span className="micro-sm text-muted-foreground">Ordine</span>
              <input
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
                className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              ["Urmărește stocul", "track_stock"],
              ["Recomandat pe prima pagină", "is_featured"],
              ["Arhivat (ascuns)", "is_archived"],
            ].map(([label, key]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft[key as "track_stock"] as boolean}
                  onChange={(e) => setDraft({ ...draft, [key as string]: e.target.checked })}
                  className="size-4 accent-foreground"
                />
                <span className="micro-sm">{label}</span>
              </label>
            ))}
          </div>

          <div>
            <p className="micro-sm text-muted-foreground">Fotografii</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Trage fotografiile pentru a schimba ordinea. Coperta este imaginea implicită în
              catalog.
            </p>
            <div className="mt-3 flex flex-wrap gap-4" aria-label="Galerie foto ordonabilă">
              {draft.images.map((img, i) => (
                <div
                  key={img.id ?? img.url}
                  data-image-index={i}
                  draggable={!busy}
                  onDragStart={(event) => {
                    draggedImageKey.current = img.id ?? img.url;
                    dragStartImages.current = draft.images;
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    const key = draggedImageKey.current;
                    const from = draft.images.findIndex((image) => (image.id ?? image.url) === key);
                    if (from < 0 || from === i) return;
                    const images = [...draft.images];
                    const [moved] = images.splice(from, 1);
                    if (!moved) return;
                    images.splice(i, 0, moved);
                    setDraft({ ...draft, images });
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragEnd={() => void finishDrag()}
                  className="w-40 cursor-grab border border-border bg-background p-2 active:cursor-grabbing"
                >
                  <div className="relative bg-field p-2">
                    <img
                      src={imageUrl(img.url) ?? ""}
                      alt=""
                      className="aspect-square w-full object-contain"
                    />
                    {img.isPrimary ? (
                      <span className="micro absolute left-1 top-1 bg-foreground px-2 py-1 text-background">
                        Principală
                      </span>
                    ) : null}
                  </div>
                  <input
                    value={img.alt}
                    placeholder="Descriere imagine"
                    onChange={(e) => {
                      const images = [...draft.images];
                      images[i] = { ...img, alt: e.target.value };
                      setDraft({ ...draft, images });
                    }}
                    className="mt-2 w-full border border-input bg-background px-2 py-1 text-xs outline-none focus:border-foreground"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={i === 0 || busy}
                      aria-label={`Mută fotografia ${i + 1} la stânga`}
                      className="micro-sm link-underline disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => void moveImage(i, i - 1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={i === draft.images.length - 1 || busy}
                      aria-label={`Mută fotografia ${i + 1} la dreapta`}
                      className="micro-sm link-underline disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => void moveImage(i, i + 1)}
                    >
                      →
                    </button>
                    {!img.isPrimary ? (
                      <button
                        type="button"
                        className="micro-sm link-underline"
                        onClick={() => void choosePrimary(i)}
                      >
                        Setează principală
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="micro-sm link-underline"
                      onClick={() => void deleteImage(i)}
                    >
                      Șterge
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-4 text-sm"
              onChange={async (e) => {
                const files = [...(e.target.files ?? [])];
                if (files.length === 0) return;
                try {
                  const uploaded: ImageDraft[] = [];
                  for (const file of files) {
                    const url = await uploadProductImage(file);
                    const isPrimary = draft.images.length === 0 && uploaded.length === 0;
                    if (draft.id) {
                      const { data, error } = await supabase
                        .from("product_images")
                        .insert({
                          product_id: draft.id,
                          url,
                          sort_order: draft.images.length + uploaded.length,
                          is_primary: false,
                        })
                        .select("id")
                        .single();
                      if (error) throw error;
                      uploaded.push({ id: data.id, url, alt: "", isPrimary });
                    } else {
                      uploaded.push({ url, alt: "", isPrimary });
                    }
                  }
                  const images = [...draft.images, ...uploaded];
                  if (!images.some((image) => image.isPrimary) && images[0]) {
                    images[0] = { ...images[0], isPrimary: true };
                  }
                  setDraft({ ...draft, images });
                  if (draft.id) await persistGallery(draft.id, images);
                  toast.success("Fotografii încărcate.");
                } catch {
                  toast.error("Fotografiile nu au putut fi încărcate.");
                }
                e.target.value = "";
              }}
            />
          </div>

          <div>
            <p className="micro-sm text-muted-foreground">Specificații</p>
            <div className="mt-3 space-y-3">
              {draft.specs.map((s, i) => (
                <div key={i} className="flex flex-wrap gap-3">
                  <input
                    value={s.label}
                    placeholder="Ex.: Material"
                    onChange={(e) => {
                      const specs = [...draft.specs];
                      specs[i] = { ...s, label: e.target.value };
                      setDraft({ ...draft, specs });
                    }}
                    className="flex-1 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                  <input
                    value={s.value}
                    placeholder="Ex.: HDPE"
                    onChange={(e) => {
                      const specs = [...draft.specs];
                      specs[i] = { ...s, value: e.target.value };
                      setDraft({ ...draft, specs });
                    }}
                    className="flex-1 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                  <button
                    type="button"
                    className="micro-sm link-underline"
                    onClick={() =>
                      setDraft({ ...draft, specs: draft.specs.filter((_, j) => j !== i) })
                    }
                  >
                    Șterge
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="micro-sm mt-3 link-underline"
              onClick={() =>
                setDraft({ ...draft, specs: [...draft.specs, { label: "", value: "" }] })
              }
            >
              Adaugă specificație
            </button>
          </div>

          <div>
            <p className="micro-sm text-muted-foreground">Opțiuni (mărimi, culori)</p>
            <div className="mt-3 space-y-3">
              {draft.variants.map((v, i) => (
                <div key={i} className="flex flex-wrap gap-3">
                  <input
                    value={v.name}
                    placeholder="Denumire opțiune"
                    onChange={(e) => {
                      const variants = [...draft.variants];
                      variants[i] = { ...v, name: e.target.value };
                      setDraft({ ...draft, variants });
                    }}
                    className="flex-1 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                  <input
                    value={v.price}
                    placeholder="Preț (opțional)"
                    onChange={(e) => {
                      const variants = [...draft.variants];
                      variants[i] = { ...v, price: e.target.value };
                      setDraft({ ...draft, variants });
                    }}
                    className="w-36 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                  <input
                    type="number"
                    value={v.stock}
                    aria-label="Stoc opțiune"
                    onChange={(e) => {
                      const variants = [...draft.variants];
                      variants[i] = { ...v, stock: Number(e.target.value) || 0 };
                      setDraft({ ...draft, variants });
                    }}
                    className="w-28 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                  <button
                    type="button"
                    className="micro-sm link-underline"
                    onClick={() =>
                      setDraft({ ...draft, variants: draft.variants.filter((_, j) => j !== i) })
                    }
                  >
                    Șterge
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="micro-sm mt-3 link-underline"
              onClick={() =>
                setDraft({
                  ...draft,
                  variants: [...draft.variants, { name: "", sku: "", price: "", stock: 0 }],
                })
              }
            >
              Adaugă opțiune
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="micro border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
            >
              {busy ? "Se salvează…" : "Salvează"}
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
      ) : (products ?? []).length === 0 ? (
        <p className="py-16 text-sm text-muted-foreground">
          Nu ai adăugat încă niciun produs. Apasă „Produs nou” pentru a începe.
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {(products ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="size-16 shrink-0 bg-field p-1">
                {primaryImage(p) ? (
                  <img
                    src={imageUrl(primaryImage(p)?.url) ?? ""}
                    alt=""
                    className="size-full object-contain"
                  />
                ) : null}
              </div>
              <div className="min-w-[200px] flex-1">
                <p className="text-sm">{p.name}</p>
                <p className="micro-sm text-muted-foreground">
                  {p.categories?.name ?? "Fără categorie"} · {formatRon(Number(p.price))} /{" "}
                  {p.selling_unit} ·{" "}
                  {p.is_archived ? "arhivat" : p.status === "published" ? "publicat" : "ciornă"}
                </p>
              </div>
              <button
                type="button"
                className="micro-sm link-underline"
                onClick={() => togglePublish(p)}
              >
                {p.status === "published" ? "Treci pe ciornă" : "Publică"}
              </button>
              <button
                type="button"
                className="micro-sm link-underline"
                onClick={() => setDraft(toDraft(p))}
              >
                Editează
              </button>
              <button type="button" className="micro-sm link-underline" onClick={() => remove(p)}>
                Șterge
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
