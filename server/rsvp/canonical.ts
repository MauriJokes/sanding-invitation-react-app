/**
 * Duplicate-detection key: Unicode NFKC, collapsed whitespace, trimmed, lower-cased.
 * Deliberately does not drop words such as "The" or "Family" (no invented matching rules).
 */
export function canonicalGroupKey(name: string): string {
  return name.normalize("NFKC").replace(/\s+/gu, " ").trim().toLowerCase();
}
