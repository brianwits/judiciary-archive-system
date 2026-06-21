import type { CaseType } from "@/types/case";
import {
  ALL_CASE_CATEGORY_DEFINITIONS,
  type CaseCategoryDefinition,
} from "@/data/seed/case-categories";

type CaseCategoryContext = {
  caseType?: CaseType | string | null;
  courtDivision?: string | null;
};

const CATEGORY_BY_CODE = new Map(
  ALL_CASE_CATEGORY_DEFINITIONS.map((category) => [normalizeCategoryToken(category.suggested_system_code), category]),
);

const CATEGORY_BY_ALIAS = new Map<string, CaseCategoryDefinition>();
for (const category of ALL_CASE_CATEGORY_DEFINITIONS) {
  const aliases = [
    category.suggested_system_code,
    category.common_prefix,
    category.case_category_name,
    category.parent_category,
    ...category.alternative_prefixes,
  ];
  for (const alias of aliases) {
    CATEGORY_BY_ALIAS.set(normalizeCategoryToken(alias), category);
  }
}

const FAMILY_BY_CATEGORY: Record<string, CaseType> = {
  Civil: "Civil",
  Criminal: "Criminal",
  ELC: "ELC",
  Family: "Family",
  "Family / Religious": "Family",
  Commercial: "Commercial",
  Constitutional: "Constitutional",
  Probate: "Probate",
  Traffic: "Traffic",
  Succession: "Succession",
  Miscellaneous: "Civil",
  Appeal: "Civil",
  Petition: "Constitutional",
  Land: "ELC",
  Labour: "Civil",
  Tribunal: "Civil",
};

const PREFERRED_CATEGORY_BY_FAMILY: Partial<Record<CaseType, string>> = {
  Civil: "HC_CIVIL",
  Criminal: "HC_CRIMINAL",
  ELC: "ELC_MATTER",
  Family: "HC_FAMILY",
  Commercial: "HC_COMMERCIAL",
  Constitutional: "HC_CONSTITUTIONAL",
  Probate: "HC_PROBATE",
  Traffic: "MC_TRAFFIC",
  Succession: "MC_SUCCESSION",
};

export function normalizeCategoryToken(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function getCaseCategoryDefinition(value: string | null | undefined): CaseCategoryDefinition | null {
  if (!value) return null;
  const token = normalizeCategoryToken(value);
  return CATEGORY_BY_CODE.get(token) ?? CATEGORY_BY_ALIAS.get(token) ?? null;
}

export function getCaseCategoryLabel(value: string | null | undefined): string {
  const category = getCaseCategoryDefinition(value);
  return category?.case_category_name ?? "Unknown category";
}

export function getCaseCategoryCode(
  value: string | null | undefined,
  caseNumber: string,
  context?: CaseCategoryContext,
): string {
  const explicit = getCaseCategoryDefinition(value);
  if (explicit) return explicit.suggested_system_code;

  const prefix = normalizeCategoryToken(caseNumber.split("/")[0] ?? "");
  const byPrefix = CATEGORY_BY_ALIAS.get(prefix);
  if (byPrefix) return byPrefix.suggested_system_code;

  const fromContext = inferCategoryFromContext(context);
  if (fromContext) return fromContext.suggested_system_code;

  return "UNKNOWN_PENDING_REVIEW";
}

export function getCaseTypeFromCategoryCode(
  value: string | null | undefined,
  context?: CaseCategoryContext,
): CaseType {
  const category = getCaseCategoryDefinition(value);
  if (category) {
    return FAMILY_BY_CATEGORY[category.parent_category] ?? inferCaseTypeFromContext(context) ?? "Civil";
  }
  return inferCaseTypeFromContext(context) ?? "Civil";
}

export function inferCategoryFromContext(
  context?: CaseCategoryContext,
): CaseCategoryDefinition | null {
  const caseType = context?.caseType;
  const courtLevel = inferCourtLevel(context?.courtDivision);

  if (caseType) {
    const normalizedCaseType = caseType.trim();
    const preferredCode = preferredCategoryForContext(normalizedCaseType as CaseType, courtLevel);
    if (preferredCode) {
      const preferred = getCaseCategoryDefinition(preferredCode);
      if (preferred) return preferred;
    }

    const matches = ALL_CASE_CATEGORY_DEFINITIONS.filter(
      (category) => FAMILY_BY_CATEGORY[category.parent_category] === normalizedCaseType,
    );
    if (matches.length === 0) return null;
    if (courtLevel) {
      const exactLevel = matches.find((category) =>
        normalizeCategoryToken(category.court_level).includes(normalizeCategoryToken(courtLevel)),
      );
      if (exactLevel) return exactLevel;
    }
    return matches[0];
  }

  if (courtLevel) {
    const match = ALL_CASE_CATEGORY_DEFINITIONS.find((category) =>
      normalizeCategoryToken(category.court_level).includes(normalizeCategoryToken(courtLevel)),
    );
    if (match) return match;
  }

  return null;
}

function inferCaseTypeFromContext(context?: CaseCategoryContext): CaseType | null {
  const caseType = context?.caseType?.trim();
  if (!caseType) return null;
  if (Object.prototype.hasOwnProperty.call(FAMILY_BY_CATEGORY, caseType)) {
    return caseType as CaseType;
  }
  return null;
}

function inferCourtLevel(courtDivision?: string | null): string | null {
  const normalized = (courtDivision ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("magistrate")) return "Magistrates Court";
  if (normalized.includes("high court")) return "High Court";
  if (normalized.includes("environment") || normalized.includes("land")) return "Environment and Land Court";
  if (normalized.includes("employment")) return "Employment and Labour Relations Court";
  return null;
}

function preferredCategoryForContext(
  caseType: CaseType,
  courtLevel: string | null,
): string | null {
  if (caseType === "Civil" || caseType === "Criminal") {
    if (courtLevel?.includes("Magistrates Court")) {
      return caseType === "Civil" ? "MC_CIVIL" : "MC_CRIMINAL";
    }
    return caseType === "Civil" ? "HC_CIVIL" : "HC_CRIMINAL";
  }
  return PREFERRED_CATEGORY_BY_FAMILY[caseType] ?? null;
}
