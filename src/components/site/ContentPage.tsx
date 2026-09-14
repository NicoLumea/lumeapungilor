import { useContent, text } from "@/lib/content";
import { imageUrl } from "@/lib/images";

export function ContentPage({
  contentKey,
  fallbackTitle,
  showCompany,
}: {
  contentKey: string;
  fallbackTitle: string;
  showCompany?: boolean;
}) {
  const { data, isLoading } = useContent();
  const block = data?.[contentKey];
  const company = data?.["company"];
  const title = text(block, "title") ?? fallbackTitle;
  const body = text(block, "body");
  const image = imageUrl(text(block, "image_url"));
  const details = showCompany
    ? ([
        ["Firmă", text(company, "name")],
        ["E-mail", text(company, "email")],
        ["Telefon", text(company, "phone")],
        ["Adresă", text(company, "address")],
        ["CUI", text(company, "cui")],
        ["Reg. Com.", text(company, "reg_com")],
        ["Program", text(company, "hours")],
      ].filter(([, v]) => Boolean(v)) as [string, string][])
    : [];


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
      {details.length > 0 ? (
        <dl className="mt-12 divide-y divide-border border-y border-border">
          {details.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-6 py-3 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>

  );
}
