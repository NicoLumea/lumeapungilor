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
    .replace(/[×✕✖]/g, "x")
    // "40 × 50 cm" and "40x50" must both be findable as "40x50".
    .replace(/(\d)\s*x\s*(\d)/g, "$1x$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** Romanian plural endings are dropped so "pungi" also finds "pungă". */
function stem(term: string): string {
  return term.length >= 4 ? term.replace(/(uri|ile|ilor|elor|le|i|e|a)$/, "") : term;
}

/** Every whitespace-separated term must appear somewhere in the haystack. */
export function matchesQuery(haystack: string, query: string): boolean {
  const target = normalizeText(haystack);
  const terms = normalizeText(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;
  return terms.every((term) => target.includes(term) || target.includes(stem(term)));
}
