import type { ChangeEvent } from "react";
import { descriptionExcerpt, markdownHeadings } from "@/lib/safe-markdown";

export function SeoField({
  label,
  value,
  target,
  multiline = false,
  onChange,
}: {
  label: string;
  value: string;
  target: number;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  const shared = {
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    className:
      "mt-2 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground",
  };
  return (
    <label className="block">
      <span className="micro-sm text-muted-foreground">{label}</span>
      {multiline ? <textarea rows={3} {...shared} /> : <input {...shared} />}
      <span className="mt-1 block text-xs text-muted-foreground">
        {value.length}/{target} caractere (recomandare editorială)
      </span>
    </label>
  );
}

export function SeoPreview({
  title,
  fallbackTitle,
  url,
  description,
  fallbackDescription,
}: {
  title: string;
  fallbackTitle: string;
  url: string;
  description: string;
  fallbackDescription: string;
}) {
  const resolvedTitle = title.trim() || fallbackTitle;
  const resolvedDescription =
    description.trim() ||
    descriptionExcerpt(fallbackDescription) ||
    "Descrierea paginii va apărea aici.";
  return (
    <div
      className="border border-border bg-background p-4"
      aria-label="Previzualizare SEO orientativă"
    >
      <p className="text-xs text-muted-foreground">
        Previzualizare orientativă — afișarea Google poate varia
      </p>
      <p className="mt-3 truncate text-xs text-emerald-700">{url}</p>
      <p className="mt-1 text-lg text-blue-700">{resolvedTitle}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{resolvedDescription}</p>
    </div>
  );
}

export function HeadingOutline({ h1, markdown }: { h1: string; markdown: string }) {
  const headings = markdownHeadings(markdown);
  const warnings: string[] = [];
  if (!h1.trim()) warnings.push("Lipsește H1.");
  let hasH2 = false;
  for (const heading of headings) {
    if (heading.level === 2) hasH2 = true;
    if (heading.level === 3 && !hasH2) warnings.push(`H3 „${heading.text}” nu are un H2 anterior.`);
  }
  if (/^#\s+/m.test(markdown))
    warnings.push("Un H1 din Markdown va fi redat ca paragraf, nu ca H1 suplimentar.");
  return (
    <div className="border border-border p-4">
      <p className="micro-sm text-muted-foreground">Structură titluri</p>
      <div className="mt-3 space-y-1 text-sm">
        <p>H1 · {h1 || "—"}</p>
        {headings.map((heading, index) => (
          <p key={`${heading.level}-${index}`} className={heading.level === 3 ? "pl-8" : "pl-4"}>
            H{heading.level} · {heading.text}
          </p>
        ))}
      </div>
      {warnings.map((warning) => (
        <p key={warning} className="mt-2 text-xs text-amber-700">
          {warning}
        </p>
      ))}
    </div>
  );
}

export function duplicateSeoWarning(
  currentId: string | undefined,
  field: "meta_title" | "meta_description",
  value: string,
  rows: {
    id: string;
    meta_title?: string | null;
    meta_description?: string | null;
    name: string;
  }[],
): string | null {
  const normalized = value.trim().toLocaleLowerCase("ro");
  if (!normalized) return null;
  const duplicate = rows.find(
    (row) =>
      row.id !== currentId && (row[field] ?? "").trim().toLocaleLowerCase("ro") === normalized,
  );
  return duplicate ? `Aceeași valoare este folosită și de „${duplicate.name}”.` : null;
}
