import type { ReactNode } from "react";

export type MarkdownHeading = { level: 2 | 3; text: string };

export function markdownHeadings(markdown: string | null | undefined): MarkdownHeading[] {
  if (!markdown) return [];
  return markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{2,3})\s+(.+?)\s*$/))
    .filter((match): match is RegExpMatchArray => !!match)
    .map((match) => ({ level: match[1]?.length === 3 ? 3 : 2, text: match[2]?.trim() ?? "" }));
}

export function markdownToText(markdown: string | null | undefined): string {
  return (markdown ?? "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function descriptionExcerpt(value: string | null | undefined, limit = 155): string {
  const text = markdownToText(value);
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit + 1);
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, boundary > limit * 0.65 ? boundary : limit).trim()}…`;
}

/** Minimal Markdown renderer: only explicitly allowed links; no raw HTML, images or H1. */
export function SafeMarkdown({
  children,
  className = "",
  allowPrivacyLink = false,
}: {
  children: string | null | undefined;
  className?: string;
  allowPrivacyLink?: boolean;
}) {
  const blocks: ReactNode[] = [];
  const paragraph: string[] = [];
  const flush = () => {
    const text = paragraph.join("\n").trim();
    if (text) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="whitespace-pre-line">
          {allowPrivacyLink
            ? text
                .split(
                  "[Politica de confidențialitate](https://lumeapungilor.ro/confidentialitate)",
                )
                .map((part, index) => (
                  <span key={index}>
                    {index > 0 ? (
                      <a
                        href="https://lumeapungilor.ro/confidentialitate"
                        className="underline underline-offset-4"
                      >
                        Politica de confidențialitate
                      </a>
                    ) : null}
                    {part}
                  </span>
                ))
            : text}
        </p>,
      );
    }
    paragraph.length = 0;
  };

  for (const line of (children ?? "").split(/\r?\n/)) {
    const heading = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (heading) {
      flush();
      if (heading[1]?.length === 2) {
        blocks.push(
          <h2 key={`h-${blocks.length}`} className="display pt-4 text-2xl text-foreground">
            {heading[2]}
          </h2>,
        );
      } else {
        blocks.push(
          <h3 key={`h-${blocks.length}`} className="pt-2 text-lg font-medium text-foreground">
            {heading[2]}
          </h3>,
        );
      }
    } else if (!line.trim()) {
      flush();
    } else {
      // A Markdown H1 is rendered as text, never as a second page H1.
      paragraph.push(line.replace(/^#\s+/, ""));
    }
  }
  flush();

  return <div className={`space-y-5 leading-relaxed ${className}`}>{blocks}</div>;
}
