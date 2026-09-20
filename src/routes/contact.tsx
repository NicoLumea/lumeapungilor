import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { companyInfo, telephoneHref } from "@/lib/company";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Lumea Pungilor" },
      { name: "description", content: "Date de contact pentru comenzi și oferte." },
      { property: "og:title", content: "Contact — Lumea Pungilor" },
      { property: "og:description", content: "Date de contact pentru comenzi și oferte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useContent();
  const company = companyInfo(data);
  const phones = [company.phonePrimary, company.phoneSecondary].filter((phone): phone is string => Boolean(phone));

  return (
    <article className="site-container max-w-[1100px] py-14 md:py-20">
      <div className="max-w-3xl">
        <h1 className="display text-4xl md:text-5xl">Contactează-ne</h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          Pentru informații despre produse, stoc, comenzi sau colaborări, echipa Lumea Pungilor poate fi contactată în timpul programului operațional. Datele complete ale companiei și modalitățile de contact sunt disponibile mai jos.
        </p>
      </div>

      <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-3">
        <section className="min-w-0 bg-background p-6 md:p-8">
          <h2 className="micro-sm text-muted-foreground">Program operațional</h2>
          {company.operatingDays ? <p className="mt-5 text-sm font-medium">{company.operatingDays}</p> : null}
          {company.operatingHours ? <p className="mt-1 text-sm text-muted-foreground">{company.operatingHours}</p> : null}
        </section>

        <section className="min-w-0 bg-background p-6 md:p-8">
          <h2 className="micro-sm text-muted-foreground">Telefon</h2>
          <ul className="mt-3 space-y-1">
            {phones.map((phone) => (
              <li key={phone}>
                <a href={telephoneHref(phone)} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium link-underline">
                  <Phone aria-hidden="true" className="size-4 stroke-[1.5]" />
                  {phone}
                </a>
              </li>
            ))}
          </ul>
          {company.secondaryPhoneNote ? <p className="mt-1 text-xs text-muted-foreground">{company.secondaryPhoneNote}</p> : null}
          <h2 className="micro-sm mt-6 text-muted-foreground">E-mail</h2>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium link-underline"
          >
            <Mail aria-hidden="true" className="size-4 stroke-[1.5]" />
            {SUPPORT_EMAIL}
          </a>
        </section>

        <section className="min-w-0 bg-background p-6 md:p-8">
          <h2 className="micro-sm mb-5 text-muted-foreground">Companie</h2>
          <CompanyIdentity />
        </section>
      </div>

      <section className="mt-12 border-t border-border pt-10 md:mt-16 md:pt-14">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <h2 className="display text-3xl md:text-4xl">{company.sellerEnquiryHeading}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{company.sellerEnquiryCopy}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            {phones.map((phone, index) => (
              <Button key={phone} asChild variant={index === 0 ? "default" : "outline"} className="micro min-h-11 rounded-none px-5 shadow-none">
                <a href={telephoneHref(phone)}><Phone aria-hidden="true" />Sună la {phone}</a>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
