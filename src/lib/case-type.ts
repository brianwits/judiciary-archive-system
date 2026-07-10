import { getCaseCategoryDefinition, getCaseTypeFromCategoryCode } from "@/lib/case-category";
import type { CaseType } from "@/types/case";
import { CASE_TYPES } from "@/types/case";
import {
  CASE_TYPE_DEFINITIONS,
  type CaseTypeDefinition,
} from "@/data/case-types";

export { CASE_TYPE_DEFINITIONS, getCaseTypeDefinition } from "@/data/case-types";
export type { CaseTypeDefinition } from "@/data/case-types";

export function getCaseTypeByCode(code: string): readonly CaseTypeDefinition[] {
  const normalized = code.trim().toUpperCase();
  return CASE_TYPE_DEFINITIONS.filter((definition) => definition.code.toUpperCase() === normalized);
}

export function legacyCaseTypeForFamily(family: string): CaseType {
  if (CASE_TYPES.includes(family as CaseType)) return family as CaseType;
  if (family === "Environment & Land") return "ELC";
  if (family === "Succession & Probate") return "Succession";
  if (family === "Constitutional & Human Rights") return "Constitutional";
  if (family === "Commercial") return "Commercial";
  if (family === "Children & Protection" || family === "Gender Justice") return "Civil";
  if (family === "Traffic") return "Traffic";
  return family === "Criminal" || family === "Anti-Corruption & Economic Crimes" || family === "Election"
    ? "Criminal"
    : "Civil";
}

export function inferCaseTypeDefinition(caseNumber: string): CaseTypeDefinition | null {
  const prefix = caseNumber.split("/")[0]?.trim().toUpperCase() ?? "";
  const matches = getCaseTypeByCode(prefix);
  return matches.length === 1 ? matches[0] : null;
}

export function inferCaseType(caseNumber: string): CaseType {
  const prefix = caseNumber.split("/")[0]?.toUpperCase();
  const category = getCaseCategoryDefinition(prefix ?? "");
  if (category) {
    return getCaseTypeFromCategoryCode(category.suggested_system_code);
  }
  if (prefix === "CR") return "Criminal";
  if (prefix === "MCT" || prefix === "MCTR") return "Traffic";
  if (prefix === "MCSUCC" || prefix === "MCS") return "Succession";
  if (prefix === "ELC") return "ELC";

  if (prefix === "COM") return "Commercial";
  if (prefix === "CON") return "Constitutional";
  if (prefix === "PRO") return "Probate";
  if (prefix === "CIV" || prefix === "MCCC") return "Civil";
  if (prefix === "MCPC") return "Civil";
  if (prefix === "MCEMP") return "Civil";
  if (prefix === "MCAC") return "Criminal";
  if (prefix === "MCEO") return "Criminal";
  if (prefix === "HCJR") return "Civil";
  if (prefix === "HCCHRPET") return "Constitutional";
  if (prefix === "MGJC") return "Civil";
  if (prefix === "MCTRBC") return "Civil";
  return "Civil";
}

export function resolveCaseType(value: string | null | undefined, caseNumber: string): CaseType {
  if (value && CASE_TYPES.includes(value as CaseType)) {
    return value as CaseType;
  }
  return inferCaseType(caseNumber);
}
