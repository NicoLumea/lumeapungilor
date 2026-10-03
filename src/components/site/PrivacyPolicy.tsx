import { Link } from "@tanstack/react-router";
import policySource from "./privacy-policy.md?raw";

const ANSPDCP_FORMS_URL = "https://www.dataprotection.ro/formulare/";

type PolicyBlock =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] };

type PolicySection = {
  id: string;
  title: string;
  blocks: PolicyBlock[];
};

function parsePolicy(source: string) {
  const preface: string[] = [];
  const sections: PolicySection[] = [];
  let section: PolicySection | null = null;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("## ")) {
      const title = line.slice(3);
      const number = title.match(/^(\d+)\./)?.[1] ?? String(sections.length + 1);
      section = { id: `sectiunea-${number}`, title, blocks: [] };
      sections.push(section);
    } else if (!section) {
      preface.push(line);
    } else if (line.startsWith("### ")) {
      section.blocks.push({ type: "subheading", text: line.slice(4) });
    } else if (line.startsWith("- ")) {
      const previous = section.blocks[section.blocks.length - 1];
      if (previous?.type === "list") {
        previous.items.push(line.slice(2));
      } else {
        section.blocks.push({ type: "list", items: [line.slice(2)] });
      }
    } else {
      section.blocks.push({ type: "paragraph", text: line });
    }
  }

  return { preface, sections };
}

const policy = parsePolicy(policySource);

function PolicyText({ children }: { children: string }) {
  if (children === "Termeni și condiții") {
    return (
      <Link to="/termeni" className="link-underline text-foreground">
        {children}
      </Link>
    );
  }
  if (children === "Politica de retur") {
    return (
      <Link to="/retur" className="link-underline text-foreground">
        {children}
      </Link>
    );
  }
  if (children === "Informații și formulare sunt disponibile pe site-ul oficial al autorității.") {
    return (
      <a
        href={ANSPDCP_FORMS_URL}
        className="link-underline text-foreground"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return <>{children}</>;
}

export function PrivacyPolicy() {
  return (
    <div className="mt-12 space-y-10">
      {policy.preface.map((line, index) => (
        <p key={index} className="text-sm text-muted-foreground">
          <PolicyText>{line}</PolicyText>
        </p>
      ))}

      <nav aria-label="Cuprinsul politicii" className="border border-border bg-field p-5 sm:p-6">
        <p className="micro-sm text-muted-foreground">Pe această pagină</p>
        <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {policy.sections.map((section) => (
            <li key={section.id}>
              <a className="link-underline" href={`#${section.id}`}>
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {policy.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="scroll-mt-24 border-t border-border pt-8"
        >
          <h2 className="display text-2xl md:text-3xl">{section.title}</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
            {section.blocks.map((block, index) => {
              if (block.type === "subheading") {
                return (
                  <h3 key={index} className="pt-2 text-lg font-medium text-foreground">
                    {block.text}
                  </h3>
                );
              }
              if (block.type === "list") {
                return (
                  <ul key={index} className="list-disc space-y-2 pl-5 marker:text-foreground">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <PolicyText>{item}</PolicyText>
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index}>
                  <PolicyText>{block.text}</PolicyText>
                </p>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
