import { getCaseCategoryDefinition, normalizeCategoryToken } from "@/lib/case-category";

export function canonicalizeCaseNumber(
  value: string,
  caseCategoryCode: string | null | undefined,
): string {
  const caseNumber = value.trim();
  const category = getCaseCategoryDefinition(caseCategoryCode);
  const canonicalPrefix = category?.common_prefix.trim();

  if (
    !caseNumber ||
    !canonicalPrefix ||
    normalizeCategoryToken(canonicalPrefix) === "VARIES"
  ) {
    return caseNumber;
  }

  const aliases = [canonicalPrefix, ...(category?.alternative_prefixes ?? [])]
    .filter((alias) => normalizeCategoryToken(alias) !== "VARIES")
    .sort((left, right) => right.length - left.length);

  for (const alias of aliases) {
    const match = caseNumber.match(
      new RegExp(`^${escapeRegExp(alias)}(?=$|[\\s/.-])`, "i"),
    );
    if (match) {
      return `${canonicalPrefix}${caseNumber.slice(match[0].length)}`;
    }
  }

  const slashIndex = caseNumber.indexOf("/");
  if (slashIndex >= 0) {
    const firstSegment = caseNumber.slice(0, slashIndex).trim();
    if (/^(?:E?\d+|No\.?\s*\d+)$/i.test(firstSegment)) {
      return `${canonicalPrefix}/${caseNumber.replace(/^\/+/, "")}`;
    }
    return `${canonicalPrefix}${caseNumber.slice(slashIndex)}`;
  }

  const textualPrefix = caseNumber.match(/^[A-Za-z][A-Za-z .()_-]*?(?=\s+(?:No\.?\s+)?E?\d)/i);
  if (textualPrefix) {
    return `${canonicalPrefix}${caseNumber.slice(textualPrefix[0].length)}`;
  }

  return `${canonicalPrefix}/${caseNumber.replace(/^\/+/, "")}`;
}

export function canonicalizeCaseNumberWithPrefix(value: string, prefix: string): string {
  const caseNumber = value.trim();
  const canonicalPrefix = prefix.trim();
  if (!caseNumber || !canonicalPrefix) return caseNumber;

  const slashIndex = caseNumber.indexOf("/");
  if (slashIndex >= 0) {
    return `${canonicalPrefix}${caseNumber.slice(slashIndex)}`;
  }

  const textualPrefix = caseNumber.match(/^[A-Za-z][A-Za-z0-9 &()._-]*?(?=\s+(?:No\.?\s+)?E?\d)/i);
  if (textualPrefix) {
    return `${canonicalPrefix}${caseNumber.slice(textualPrefix[0].length)}`;
  }

  return `${canonicalPrefix}/${caseNumber.replace(/^\/+/, "")}`;
}

export function normalizeCaseNumberLookup(value: string): string {
  return value.trim().toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
