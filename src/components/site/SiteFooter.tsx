import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { useCategories, useContent, text } from "@/lib/content";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { companyInfo, telephoneHref, whatsappHref, CONSUMER_LINKS, SUPPORT_EMAIL } from "@/lib/company";

export function SiteFooter() {
  const { data: content } = useContent();
  const { data: categories } = useCategories();
  const companyBlock = content?.["company"];
  const company = companyInfo(content);
  const name = company.brandName ?? "Lumea Pungilor";
  const facebook = text(companyBlock, "facebook");
  const instagram = text(companyBlock, "instagram");

  return (
    <footer className="mt-24 border-t border-border">
      <div className="site-container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <p className="micro">{name.toUpperCase()}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Pungi, fețe de masă și folie cu bule pentru activități comerciale și profesionale.
          </p>
        </div>

        <div>
          <p className="micro-sm text-muted-foreground">Catalog</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/produse" className="link-underline">
                Toate produsele
              </Link>
            </li>
            {(categories ?? []).map((c) => (
              <li key={c.id}>
                <Link to="/categorie/$slug" params={{ slug: c.slug }} className="link-underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="micro-sm text-muted-foreground">Informații</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/despre" className="link-underline">
                Despre
              </Link>
            </li>
            <li>
              <Link to="/contact" className="link-underline">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/livrare" className="link-underline">
                Livrare
              </Link>
            </li>
            <li>
              <Link to="/retur" className="link-underline">
                Retur
              </Link>
            </li>
            <li>
              <Link to="/termeni" className="link-underline">
                Termeni și condiții
              </Link>
            </li>
            <li>
              <Link to="/confidentialitate" className="link-underline">
                Confidențialitate
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="micro-sm text-muted-foreground">Contact</p>
          <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
            {company.phonePrimary ? (
              <li>
                <a href={telephoneHref(company.phonePrimary)} className="inline-flex min-h-11 items-center link-underline text-foreground">
                  {company.phonePrimary}
                </a>
              </li>
            ) : null}
            {company.phoneSecondary ? (
              <li>
                <a href={telephoneHref(company.phoneSecondary)} className="inline-flex min-h-11 items-center link-underline text-foreground">
                  {company.phoneSecondary}
                </a>
                {company.secondaryPhoneNote ? <span className="block text-xs">{company.secondaryPhoneNote}</span> : null}
              </li>
            ) : null}
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex min-h-11 items-center link-underline text-foreground">
                {SUPPORT_EMAIL}
              </a>
            </li>
            {company.operatingDays ? <li className="pt-4 text-foreground">{company.operatingDays}</li> : null}
            {company.operatingHours ? <li>{company.operatingHours}</li> : null}
          </ul>
          {company.phonePrimary ? (
            <div className="mt-4 flex items-center gap-3">
              <a
                href={telephoneHref(company.phonePrimary)}
                aria-label="Sună-ne"
                title="Sună-ne"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Phone aria-hidden="true" className="size-5" />
              </a>
              <a
                href={whatsappHref(company.phonePrimary)}
                target="_blank"
                rel="noreferrer"
                aria-label="Contactează-ne pe WhatsApp"
                title="Scrie-ne pe WhatsApp"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.12 11.91c0 1.66.44 3.28 1.28 4.7L2 22l5.55-1.34c1.36.74 2.89 1.13 4.45 1.13h.04c5.46 0 9.91-4.45 9.92-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.74 13.96c-.24.68-1.37 1.25-1.92 1.33-.51.08-1.07.11-2.45-.24-2.08-.55-4.11-1.9-5.44-3.23a14.53 14.53 0 0 1-2.86-3.72c-.61-1.24-.08-1.88.46-2.04.53-.16 1.09-.08 1.5.23.41.31.79.95.99 1.35.2.41.42.87.32 1.28-.1.41-.47.62-1.08 1.18-.36.34-.31.62-.13.87.19.25.96 1.15 1.92 1.86 1.1.82 2.14 1.09 2.58 1.21.44.12.75-.1.97-.48.22-.38.51-.9.82-1.14.31-.24.7-.15.97.06.27.21 1.18.81 1.42 1.02.24.21.4.31.46.49.06.18.03.93-.21 1.61z" />
                </svg>
              </a>
            </div>
          ) : null}
          {facebook || instagram ? (
            <ul className="mt-4 flex gap-4">
              {facebook ? (
                <li>
                  <a href={facebook} className="micro-sm link-underline" rel="noreferrer" target="_blank">
                    Facebook
                  </a>
                </li>
              ) : null}
              {instagram ? (
                <li>
                  <a href={instagram} className="micro-sm link-underline" rel="noreferrer" target="_blank">
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="site-container py-6">
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Informații pentru consumatori:{" "}
            <a href={CONSUMER_LINKS.anpc} target="_blank" rel="noreferrer noopener" className="link-underline">
              Autoritatea Națională pentru Protecția Consumatorilor (ANPC)
            </a>{" "}
            și{" "}
            <a href={CONSUMER_LINKS.sal} target="_blank" rel="noreferrer noopener" className="link-underline">
              platforma SAL – soluționarea alternativă a litigiilor
            </a>
            .
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="site-container grid gap-6 py-6 md:grid-cols-[1fr_auto] md:items-end">
          <CompanyIdentity />
          <div className="flex flex-wrap items-center gap-5 md:justify-end">
            <p className="micro-sm text-muted-foreground">
              © {new Date().getFullYear()} {name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
