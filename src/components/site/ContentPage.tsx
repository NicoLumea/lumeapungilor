import { useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import type { ReactNode } from "react";
import { SafeMarkdown } from "@/lib/safe-markdown";

export function ContentPage({
  contentKey,
  fallbackTitle,
  titleOverride,
  bodyOverride,
  showCompany = false,
  children,
  initialBlock,
}: {
  contentKey: string;
  fallbackTitle: string;
  titleOverride?: string;
  bodyOverride?: string;
  showCompany?: boolean;
  children?: ReactNode;
  initialBlock?: Record<string, unknown>;
}) {
  const { data } = useContent();
  const block = data?.[contentKey] ?? initialBlock;
  const title = titleOverride ?? text(block, "title") ?? fallbackTitle;
  const body = bodyOverride ?? text(block, "body");
  const image = imageUrl(text(block, "image_url"));

  return (
    <article className="site-container max-w-[900px] py-20">
      <h1 className="display text-4xl md:text-5xl">{title}</h1>
      {image ? (
        <div className="mt-10 bg-field">
          <img src={image} alt={title} className="w-full object-cover" />
        </div>
      ) : null}
      {body ? <SafeMarkdown className="mt-10 text-base text-foreground" children={body} /> : null}
      {children}
      {showCompany ? (
        <aside className="mt-12 border-y border-border py-6">
          <p className="micro-sm mb-4 text-muted-foreground">Datele operatorului</p>
          <CompanyIdentity />
        </aside>
      ) : null}
    </article>
  );
}
