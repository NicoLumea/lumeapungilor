import { companyInfo, telephoneHref } from "@/lib/company";
import { useContent } from "@/lib/content";

export function CompanyIdentity({ sellerLabel = false, showPhones = false }: { sellerLabel?: boolean; showPhones?: boolean }) {
  const { data } = useContent();
  const company = companyInfo(data);

  if (!company.legalName && !company.address && !company.cui && !company.tradeRegisterNumber) return null;

  return (
    <div className="min-w-0 text-sm leading-relaxed">
      {company.legalName ? (
        <p className="break-words font-medium">
          {sellerLabel ? "Vânzător: " : ""}
          {company.legalName}
        </p>
      ) : null}
      {company.address ? <p className="mt-1 break-words text-muted-foreground">{sellerLabel ? `Adresă: ${company.address}` : company.address}</p> : null}
      {company.cui ? <p className="mt-1 text-muted-foreground">CUI: {company.cui}</p> : null}
      {company.tradeRegisterNumber ? (
        <p className="mt-1 break-words text-muted-foreground">Registrul Comerțului: {company.tradeRegisterNumber}</p>
      ) : null}
      {showPhones && (company.phonePrimary || company.phoneSecondary) ? (
        <p className="mt-1 break-words text-muted-foreground">
          Telefon:{" "}
          {company.phonePrimary ? <a className="link-underline text-foreground" href={telephoneHref(company.phonePrimary)}>{company.phonePrimary}</a> : null}
          {company.phonePrimary && company.phoneSecondary ? " / " : ""}
          {company.phoneSecondary ? <a className="link-underline text-foreground" href={telephoneHref(company.phoneSecondary)}>{company.phoneSecondary}</a> : null}
        </p>
      ) : null}
    </div>
  );
}