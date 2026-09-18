/** Convert a database NUMERIC(12,2) value to integer bani without binary rounding. */
export function toBani(value: string | number): number {
  const text = String(value);
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(text)) throw new Error("Preț invalid");
  const [whole, fraction = ""] = text.split(".");
  const bani = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(bani)) throw new Error("Preț invalid");
  return bani;
}

export function fromBani(bani: number): number {
  if (!Number.isSafeInteger(bani)) throw new Error("Sumă invalidă");
  return bani / 100;
}

export function vatBani(baseBani: number, rate: string | number): number {
  const rateBps = Math.round(Number(rate) * 100);
  if (
    !Number.isSafeInteger(baseBani) ||
    !Number.isSafeInteger(rateBps) ||
    rateBps < 0 ||
    rateBps > 10000
  ) {
    throw new Error("TVA invalid");
  }
  return Math.round((baseBani * rateBps) / 10000);
}
