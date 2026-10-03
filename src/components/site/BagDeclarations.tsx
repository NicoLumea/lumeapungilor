const BAG_DECLARATIONS = [
  {
    href: "/documente/ozplastik-conformitate-ro.docx",
    label: "Declarație de conformitate — română",
  },
  {
    href: "/documente/ozplastik-conformitate-en.docx",
    label: "Declaration of conformity — English",
  },
  {
    href: "/documente/ozplastik-50-microni-ro.docx",
    label: "Declarație de conformitate și livrare, 50 microni — română",
  },
  {
    href: "/documente/ozplastik-50-microni-en.docx",
    label: "Declaration of conformity and delivery, 50 microns — English",
  },
];

export function BagDeclarations() {
  return (
    <details className="mt-6 border-y border-border py-4 text-sm">
      <summary className="cursor-pointer py-2 font-medium">
        Documente de conformitate pentru pungi
      </summary>
      <p className="mt-3 text-muted-foreground">
        Declarații furnizate de ÖZPLASTİK pentru pungi din polietilenă LDPE/HDPE. Documentele
        privind grosimea de 50 microni se referă la livrările către DEKORAMA IMPORT SRL din anii
        2024–2026.
      </p>
      <ul className="mt-3 space-y-2">
        {BAG_DECLARATIONS.map((d) => (
          <li key={d.href}>
            <a href={d.href} download className="inline-block py-2 underline underline-offset-4">
              {d.label} (DOCX)
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
