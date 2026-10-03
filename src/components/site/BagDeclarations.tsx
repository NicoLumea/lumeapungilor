import { useState } from "react";

const BAG_DECLARATIONS = [
  {
    href: "/documente/ozplastik-conformitate-ro.pdf",
    label: "Declarație de conformitate — română",
  },
  {
    href: "/documente/ozplastik-conformitate-en.pdf",
    label: "Declaration of conformity — English",
  },
  {
    href: "/documente/ozplastik-50-microni-ro.pdf",
    label: "Declarație de conformitate și livrare, 50 microni — română",
  },
  {
    href: "/documente/ozplastik-50-microni-en.pdf",
    label: "Declaration of conformity and delivery, 50 microns — English",
  },
];

export function BagDeclarations() {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(href: string) {
    setPending(href);
    setError(null);
    try {
      const response = await fetch(href);
      if (!response.ok || !response.headers.get("content-type")?.includes("application/pdf")) {
        throw new Error("Document unavailable");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = href.split("/").pop()!;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError(
        "Descărcarea nu a reușit. Folosește linkul «Deschide PDF» pentru a deschide și salva documentul într-o filă nouă.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <details className="mt-6 border-y border-border py-4 text-sm">
      <summary className="cursor-pointer py-2 font-medium">
        Documente de conformitate pentru pungi
      </summary>
      <p className="mt-3 text-muted-foreground">
        Declarații furnizate de ÖZPLASTİK pentru pungi din polietilenă LDPE/HDPE. Documentele
        privind grosimea de 50 microni se referă la livrările către DEKORAMA IMPORT SRL din anii
        2024–2026. Copii publice cu codul fiscal al furnizorului ascuns, fără semnătură sau
        ștampilă.
      </p>
      <ul className="mt-3 space-y-2">
        {BAG_DECLARATIONS.map((d) => (
          <li key={d.href}>
            <span className="block">{d.label}</span>
            <div className="flex flex-wrap gap-x-5">
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => void download(d.href)}
                className="py-2 underline underline-offset-4 disabled:opacity-50"
                aria-label={`Descarcă ${d.label}`}
              >
                {pending === d.href ? "Se descarcă…" : "Descarcă PDF"}
              </button>
              <a
                href={d.href}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 underline underline-offset-4"
                aria-label={`Deschide ${d.label}`}
              >
                Deschide PDF
              </a>
            </div>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-destructive">
          {error}
        </p>
      )}
    </details>
  );
}
