import { Link } from "@tanstack/react-router";
import { useCategories, useContent, text } from "@/lib/content";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { companyInfo, telephoneHref } from "@/lib/company";

export function SiteFooter() {
  const { data: content } = useContent();
  const { data: categories } = useCategories();
  const companyBlock = content?.["company"];
  const company = companyInfo(content);
  const name = company.brandName ?? "Lumea Pungilor";
  const facebook = text(companyBlock, "facebook");
  const instagram = text(companyBlock, "instagram");
  const footerText = text(companyBlock, "footer_text");

  return (
    <footer className="mt-24 border-t border-border">
      <div className="site-container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <p className="micro">{name.toUpperCase()}</p>
          {footerText ? (
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{footerText}</p>
          ) : null}
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
            {company.operatingDays ? <li className="pt-4 text-foreground">{company.operatingDays}</li> : null}
            {company.operatingHours ? <li>{company.operatingHours}</li> : null}
          </ul>
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
        <div className="site-container grid gap-6 py-6 md:grid-cols-[1fr_auto] md:items-end">
          <CompanyIdentity />
          <div className="flex flex-wrap items-center gap-5 md:justify-end">
          <p className="micro-sm text-muted-foreground">
            © {new Date().getFullYear()} {name}
          </p>
          <Link to="/admin" className="micro-sm text-muted-foreground link-underline">
            Administrare
          </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
