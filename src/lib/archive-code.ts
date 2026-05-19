type ArchiveCodeInput = {
  court: string;
  caseType: string;
  year: number;
  caseNo: string;
};

export function buildArchiveCode({
  court,
  caseType,
  year,
  caseNo,
}: ArchiveCodeInput): string {
  const typeCode = caseType.slice(0, 3).toUpperCase();
  const normalizedCaseNo = caseNo.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `${court.toUpperCase()}-${typeCode}-${year}-${normalizedCaseNo}`;
}
