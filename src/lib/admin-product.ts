import { slugify } from "./format.ts";
import type { Json } from "../integrations/supabase/types.ts";

export type AdminProductImageDraft = {
  id?: string;
  url: string;
  alt: string;
  isPrimary: boolean;
};

export type AdminProductVariantDraft = {
  id?: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
};

export type AdminProductDraft = {
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
  specs: Array<{ label: string; value: string }>;
  images: AdminProductImageDraft[];
  variants: AdminProductVariantDraft[];
};

export type ProductSaveInput = {
  productId: string | null;
  product: { [key: string]: Json | undefined };
  images: Array<{ [key: string]: Json | undefined }>;
  variants: Array<{ [key: string]: Json | undefined }>;
};

function decimal(value: string, label: string, optional = false): number | null {
  if (optional && value.trim() === "") return null;
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} trebuie să fie un număr pozitiv.`);
  }
  return parsed;
}

function integer(value: number, label: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${label} trebuie să fie un număr întreg de cel puțin ${minimum}.`);
  }
  return value;
}

export function buildProductSaveInput(draft: AdminProductDraft): ProductSaveInput {
  const name = draft.name.trim();
  if (!name) throw new Error("Numele produsului este obligatoriu.");

  const slug = (draft.slug.trim() || slugify(name)).toLowerCase();
  if (!slug) throw new Error("Adresa produsului nu a putut fi generată.");

  let unitsPerPack: number | null = null;
  if (draft.units_per_pack.trim()) {
    unitsPerPack = Number(draft.units_per_pack);
    if (!Number.isSafeInteger(unitsPerPack) || unitsPerPack < 1) {
      throw new Error("Bucățile per unitate trebuie să fie un număr întreg pozitiv.");
    }
  }

  const images = draft.images.map((image, index) => ({
    ...(image.id ? { id: image.id } : {}),
    url: image.url.trim(),
    alt: image.alt.trim() || null,
    sort_order: index,
    is_primary: image.isPrimary,
  }));
  if (images.some((image) => !image.url)) throw new Error("O fotografie nu are o adresă validă.");
  if (new Set(images.map((image) => image.url)).size !== images.length) {
    throw new Error("Aceeași fotografie apare de mai multe ori în galerie.");
  }
  if (images.length > 0 && !images.some((image) => image.is_primary)) {
    images[0] = { ...images[0]!, is_primary: true };
  }
  if (images.filter((image) => image.is_primary).length > 1) {
    throw new Error("Galeria poate avea o singură fotografie principală.");
  }

  const variants = draft.variants
    .filter((variant) => variant.name.trim())
    .map((variant, index) => ({
      name: variant.name.trim(),
      sku: variant.sku.trim() || null,
      price: decimal(variant.price, `Prețul opțiunii ${variant.name.trim()}`, true),
      stock: integer(variant.stock, `Stocul opțiunii ${variant.name.trim()}`),
      sort_order: index,
    }));

  return {
    productId: draft.id ?? null,
    product: {
      name,
      slug,
      description: draft.description.trim() || null,
      category_id: draft.category_id || null,
      sku: draft.sku.trim() || null,
      price: decimal(draft.price, "Prețul"),
      selling_unit: draft.selling_unit.trim() || "set",
      units_per_pack: unitsPerPack,
      min_order_qty: integer(draft.min_order_qty, "Cantitatea minimă", 1),
      qty_increment: integer(draft.qty_increment, "Pasul cantității", 1),
      stock: integer(draft.stock, "Stocul"),
      track_stock: draft.track_stock,
      status: draft.status,
      is_featured: draft.is_featured,
      is_archived: draft.is_archived,
      sort_order: integer(draft.sort_order, "Ordinea"),
      specs: draft.specs
        .map((spec) => ({ label: spec.label.trim(), value: spec.value.trim() }))
        .filter((spec) => spec.label && spec.value),
    },
    images,
    variants,
  };
}
