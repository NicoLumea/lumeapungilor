import { companyInfo, internationalTelephone } from "@/lib/company";
import { useContent } from "@/lib/content";

export function OrganizationStructuredData() {
  const { data } = useContent();
  const company = companyInfo(data);
  if (!company.brandName || !company.legalName || !company.address) return null;

  const primary = internationalTelephone(company.phonePrimary);
  const secondary = internationalTelephone(company.phoneSecondary);
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