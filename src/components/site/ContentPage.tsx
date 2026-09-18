import { useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";

export function ContentPage({
  contentKey,
  fallbackTitle,
  showCompany = true,
}: {
  contentKey: string;
  fallbackTitle: string;
  showCompany?: boolean;
}) {
  const { data, isLoading } = useContent();
  const block = data?.[contentKey];
  const title = text(block, "title") ?? fallbackTitle;
  const body = text(block, "body");
  const image = imageUrl(text(block, "image_url"));


  return (
    <article className="site-container max-w-[900px] py-20">
      <h1 className="display text-4xl md:text-5xl">{title}</h1>
      {image ? (
        <div className="mt-10 bg-field">
          <img src={image} alt={title} className="w-full object-cover" />
        </div>
      ) : null}
      {body ? (
        <div className="mt-10 space-y-5 text-base leading-relaxed text-foreground">
          {body.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>
      ) : isLoading ? null : (
        <p className="mt-10 text-sm text-muted-foreground">
          Lumea Pungilor | versiune de lucru
        </p>
      )}
      {showCompany ? (
        <aside className="mt-12 border-y border-border py-6">
          <p className="micro-sm mb-4 text-muted-foreground">Datele operatorului</p>
          <CompanyIdentity />
        </aside>
      ) : null}
    </article>

  );
}
