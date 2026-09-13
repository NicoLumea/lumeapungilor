import { useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";

export function ContentPage({ contentKey, fallbackTitle }: { contentKey: string; fallbackTitle: string }) {
  const { data, isLoading } = useContent();
  const block = data?.[contentKey];
  const title = text(block, "title") ?? fallbackTitle;
  const body = text(block, "body");
  const image = imageUrl(text(block, "image_url"));

  return (
    <article className="mx-auto max-w-[900px] px-4 py-20 md:px-8">
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
          Conținutul acestei pagini nu a fost completat încă.
        </p>
      )}
    </article>
  );
}
