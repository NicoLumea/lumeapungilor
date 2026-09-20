/** Lowercase and strip Romanian diacritics so search matches "fata" and "față" alike. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u0326\u0327]/g, "")
    .replace(/[șşś]/gi, "s")
    .replace(/[țţ]/gi, "t")
    .replace(/[ăâà]/gi, "a")
    .replace(/[î]/gi, "i")
    .toLowerCase()
    .trim();
}

/** Every whitespace-separated term must appear somewhere in the haystack. */
export function matchesQuery(haystack: string, query: string): boolean {
  const target = normalizeText(haystack);
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  return terms.every((term) => target.includes(term));
}
