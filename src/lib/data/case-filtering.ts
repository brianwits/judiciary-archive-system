import type { CaseFile, CaseFilters } from "@/types/case";

export function filterCases(
  cases: CaseFile[],
  filters?: CaseFilters,
  aliasesByCaseId: ReadonlyMap<string, readonly string[]> = new Map(),
): CaseFile[] {
  let result = [...cases];
  const search = filters?.q ?? filters?.query;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (c) =>
        c.caseNumber.toLowerCase().includes(q) ||
        c.plaintiff.toLowerCase().includes(q) ||
        c.defendant.toLowerCase().includes(q) ||
        c.archiveCode.toLowerCase().includes(q) ||
        c.caseTypeCode.toLowerCase().includes(q) ||
        c.caseTypeName.toLowerCase().includes(q) ||
        c.caseTypeFullLabel.toLowerCase().includes(q) ||
        c.caseCategoryCode.toLowerCase().includes(q) ||
        c.caseCategoryName.toLowerCase().includes(q) ||
        (aliasesByCaseId.get(c.id) ?? []).some((alias) => alias.toLowerCase().includes(q)),
    );
  }

  if (filters?.caseType) result = result.filter((c) => c.caseType === filters.caseType);
  if (filters?.caseTypeId) result = result.filter((c) => c.caseTypeId === filters.caseTypeId);
  if (filters?.classificationStatus) {
    result = result.filter((c) => c.classificationStatus === filters.classificationStatus);
  }
  if (filters?.caseCategory) {
    const category = filters.caseCategory.toLowerCase();
    result = result.filter(
      (c) =>
        c.caseCategoryCode.toLowerCase() === category ||
        c.caseCategoryName.toLowerCase().includes(category),
    );
  }
  if (filters?.year) result = result.filter((c) => c.year === filters.year);
  if (filters?.status) result = result.filter((c) => c.status === filters.status);
  if (filters?.courtDivision) {
    result = result.filter((c) => c.courtDivision === filters.courtDivision);
  }
  if (filters?.partyName) {
    const p = filters.partyName.toLowerCase();
    result = result.filter(
      (c) => c.plaintiff.toLowerCase().includes(p) || c.defendant.toLowerCase().includes(p),
    );
  }

  return result;
}
