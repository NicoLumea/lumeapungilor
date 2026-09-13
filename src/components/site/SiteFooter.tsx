import { Link } from "@tanstack/react-router";
import { useCategories, useContent, text } from "@/lib/content";

export function SiteFooter() {
  const { data: content } = useContent();
  const { data: categories } = useCategories();
  const company = content?.["company"];

  const name = text(company, "name") ?? "Lumea Pungilor";
  const email = text(company, "email");
  const phone = text(company, "phone");
  const address = text(company, "address");
  const cui = text(company, "cui");
  const regCom = text(company, "reg_com");
  const facebook = text(company, "facebook");
  const instagram = text(company, "instagram");
  const footerText = text(company, "footer_text");

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
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {email ? (
              <li>
                <a href={`mailto:${email}`} className="link-underline text-foreground">
                  {email}
                </a>
              </li>
            ) : null}
            {phone ? (
              <li>
                <a href={`tel:${phone}`} className="link-underline text-foreground">
                  {phone}
                </a>
              </li>
            ) : null}
            {address ? <li>{address}</li> : null}
            {cui ? <li>CUI {cui}</li> : null}
            {regCom ? <li>Reg. com. {regCom}</li> : null}
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
        <div className="site-container flex flex-wrap items-center justify-between gap-3 py-5">
          <p className="micro-sm text-muted-foreground">
            © {new Date().getFullYear()} {name}
          </p>
          <Link to="/admin" className="micro-sm text-muted-foreground link-underline">
            Administrare
          </Link>
        </div>
      </div>
    </footer>
  );
}
