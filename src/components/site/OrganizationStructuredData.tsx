import { companyInfo, telephoneHref } from "@/lib/company";
import { useContent } from "@/lib/content";

export function OrganizationStructuredData() {
  const { data } = useContent();
  const company = companyInfo(data);
  if (!company.brandName || !company.legalName || !company.address) return null;

  const primary = telephoneHref(company.phonePrimary)?.replace("tel:", "");
  const secondary = telephoneHref(company.phoneSecondary)?.replace("tel:", "");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.brandName,
    legalName: company.legalName,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address,
      addressCountry: "RO",
    },
    telephone: primary,
    contactPoint: secondary
      ? [{ "@type": "ContactPoint", telephone: secondary }]
      : undefined,
    taxID: company.cui,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}