/** Only a confirmed product attribute can enable the eco-tax notice. */
export function priceNotice(product: { eco_tax_applicable?: boolean | null }): string {
  return product.eco_tax_applicable === true ? "TVA și ecotaxă incluse" : "TVA inclus";
}
