import { priceNotice } from "@/lib/price-notice";

export function PriceNotice({ product }: { product: { eco_tax_applicable?: boolean | null } }) {
  return <p className="mt-1 text-xs leading-5 text-muted-foreground">{priceNotice(product)}</p>;
}
