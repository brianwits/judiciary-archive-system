import type { CaseFile, CaseFilters } from "@/types/case";

export function filterCases(cases: CaseFile[], filters?: CaseFilters): CaseFile[] {
  let result = [...cases];
  const search = filters?.q ?? filters?.query;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (c) =>
        c.caseNumber.toLowerCase().includes(q) ||
        c.plaintiff.toLowerCase().includes(q) ||
        c.defendant.toLowerCase().includes(q) ||
        c.archiveCode.toLowerCase().includes(q),
    );
  }

  if (filters?.caseType) result = result.filter((c) => c.caseType === filters.caseType);
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
