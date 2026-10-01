export function calculateOrderTotals(
  subtotal: number,
  shippingFlat: number,
  freeShippingOver: number | null,
  vatRate: number | null,
) {
  const shipping = freeShippingOver !== null && subtotal >= freeShippingOver ? 0 : shippingFlat;
  const tax = vatRate === null ? 0 : Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  return { subtotal, shipping, tax, total };
}
