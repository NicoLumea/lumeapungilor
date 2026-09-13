import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useContent } from "@/lib/content";
import { uploadProductImage } from "@/lib/admin-data";
import { imageUrl } from "@/lib/images";

export const Route = createFileRoute("/admin/content")({
  component: AdminContent,
});

type FieldKind = "text" | "textarea" | "image" | "number" | "boolean";
type Field = { name: string; label: string; kind: FieldKind; hint?: string };

const GROUPS: { key: string; title: string; note?: string; fields: Field[] }[] = [
  {
    key: "company",
    title: "Date firmă",
    note: "Apar în subsol și pe pagina de contact. Lasă gol ce nu vrei să afișezi.",
    fields: [
      { name: "name", label: "Denumire", kind: "text" },
      { name: "tagline", label: "Descriere scurtă", kind: "text" },
      { name: "email", label: "E-mail", kind: "text" },
      { name: "phone", label: "Telefon", kind: "text" },
      { name: "address", label: "Adresă", kind: "textarea" },
      { name: "cui", label: "CUI", kind: "text" },
      { name: "reg_com", label: "Nr. Reg. Com.", kind: "text" },
      { name: "hours", label: "Program", kind: "text" },
    ],
  },
  {
    key: "home",
    title: "Pagina principală",
    fields: [
      { name: "hero_eyebrow", label: "Text mic deasupra titlului", kind: "text" },
      { name: "hero_title", label: "Titlu principal", kind: "text" },
      { name: "hero_text", label: "Text introductiv", kind: "textarea" },
      { name: "hero_image_url", label: "Imagine principală", kind: "image" },
      { name: "editorial_title", label: "Titlu secțiune text", kind: "text" },
      { name: "editorial_text", label: "Text secțiune", kind: "textarea" },
      { name: "editorial_image_url", label: "Imagine secțiune", kind: "image" },
    ],
  },
  {
    key: "settings",
    title: "Livrare, TVA și plăți",
    note: "Aceste valori se folosesc la calculul comenzii.",
    fields: [
      { name: "shipping_flat", label: "Cost livrare (RON)", kind: "number", hint: "Lasă gol dacă se stabilește manual." },
      { name: "free_shipping_over", label: "Livrare gratuită peste (RON)", kind: "number" },
      { name: "vat_rate", label: "Cotă TVA (%)", kind: "number", hint: "Lasă gol dacă prețurile includ deja TVA." },
      {
        name: "payments_configured",
        label: "Plăți online activate",
        kind: "boolean",
        hint: "Lasă nebifat cât timp nu ai un procesator de plăți conectat.",
      },
    ],
  },
  ...["about", "contact", "shipping", "returns", "terms", "privacy"].map((key) => ({
    key,
    title: {
      about: "Pagina Despre",
      contact: "Pagina Contact",
      shipping: "Pagina Livrare",
      returns: "Pagina Retur",
      terms: "Pagina Termeni și condiții",
      privacy: "Pagina Confidențialitate",
    }[key] as string,
    fields: [
      { name: "title", label: "Titlu", kind: "text" as FieldKind },
      { name: "body", label: "Text", kind: "textarea" as FieldKind },
      { name: "image_url", label: "Imagine", kind: "image" as FieldKind },
    ],
  })),
];

function AdminContent() {
  const qc = useQueryClient();
  const { data, isLoading } = useContent();
  const [values, setValues] = useState<Record<string, Record<string, unknown>>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  async function save(key: string) {
    setBusy(key);
    const { error } = await supabase
      .from("site_content")
      .upsert({ key, value: (values[key] ?? {}) as never }, { onConflict: "key" });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Salvat.");
    qc.invalidateQueries({ queryKey: ["site_content"] });
  }

  function set(group: string, field: string, value: unknown) {
    setValues((v) => ({ ...v, [group]: { ...(v[group] ?? {}), [field]: value } }));
  }

  if (isLoading) return <p className="py-16 text-sm text-muted-foreground">Se încarcă…</p>;

  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="display text-3xl">Conținut site</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Textele, imaginile și datele firmei afișate pe site. Fiecare secțiune se salvează separat.
      </p>

      <div className="mt-10 space-y-10">
        {GROUPS.map((group) => {
          const block = values[group.key] ?? {};
          return (
            <section key={group.key} className="border border-border p-6">
              <h2 className="micro">{group.title}</h2>
              {group.note ? (
                <p className="mt-2 text-xs text-muted-foreground">{group.note}</p>
              ) : null}
              <div className="mt-5 space-y-5">
                {group.fields.map((f) => {
                  const raw = block[f.name];
                  if (f.kind === "boolean") {
                    return (
                      <label key={f.name} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={raw === true}
                          onChange={(e) => set(group.key, f.name, e.target.checked)}
                          className="size-4 accent-foreground"
                        />
                        <span className="micro-sm">{f.label}</span>
                      </label>
                    );
                  }
                  if (f.kind === "image") {
                    const path = typeof raw === "string" ? raw : "";
                    return (
                      <div key={f.name}>
                        <span className="micro-sm text-muted-foreground">{f.label}</span>
                        <div className="mt-2 flex items-center gap-4">
                          {path ? (
                            <img
                              src={imageUrl(path) ?? ""}
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
                                set(group.key, f.name, await uploadProductImage(file));
                                toast.success("Imagine încărcată. Nu uita să salvezi secțiunea.");
                              } catch {
                                toast.error("Imaginea nu a putut fi încărcată.");
                              }
                            }}
                          />
                          {path ? (
                            <button
                              type="button"
                              className="micro-sm link-underline"
                              onClick={() => set(group.key, f.name, "")}
                            >
                              Elimină
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  const value = raw === null || raw === undefined ? "" : String(raw);
                  return (
                    <label key={f.name} className="block">
                      <span className="micro-sm text-muted-foreground">{f.label}</span>
                      {f.kind === "textarea" ? (
                        <textarea
                          rows={6}
                          value={value}
                          onChange={(e) => set(group.key, f.name, e.target.value)}
                          className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                        />
                      ) : (
                        <input
                          value={value}
                          inputMode={f.kind === "number" ? "decimal" : undefined}
                          onChange={(e) =>
                            set(
                              group.key,
                              f.name,
                              f.kind === "number"
                                ? e.target.value.trim() === ""
                                  ? ""
                                  : Number(e.target.value.replace(",", "."))
                                : e.target.value,
                            )
                          }
                          className="mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                        />
                      )}
                      {f.hint ? (
                        <span className="mt-1 block text-xs text-muted-foreground">{f.hint}</span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => save(group.key)}
                disabled={busy === group.key}
                className="micro mt-6 border border-foreground bg-foreground px-6 py-3 text-background disabled:opacity-40"
              >
                {busy === group.key ? "Se salvează…" : "Salvează secțiunea"}
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
