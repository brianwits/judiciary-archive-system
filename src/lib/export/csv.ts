export function escapeCsvField(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const lines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ];
  return lines.join("\r\n");
}

export function casesToCsvRows(
  cases: Array<{
    caseNumber: string;
    caseType: string;
    caseTypeId: number | null;
    caseTypeCode: string;
    caseTypeName: string;
    caseTypeFullLabel: string;
    classificationStatus: string;
    caseCategoryCode: string;
    caseCategoryName: string;
    plaintiff: string;
    defendant: string;
    status: string;
    archiveCode: string;
    courtDivision: string;
    year: number;
  }>,
): string {
  return buildCsv(
    [
      "case_number",
      "case_type",
      "case_type_id",
      "case_type_code",
      "case_type_name",
      "case_type_full_label",
      "classification_status",
      "case_category_code",
      "case_category_name",
      "plaintiff",
      "defendant",
      "status",
      "archive_code",
      "court_division",
      "year",
    ],
    cases.map((c) => [
      c.caseNumber,
      c.caseType,
      c.caseTypeId,
      c.caseTypeCode,
      c.caseTypeName,
      c.caseTypeFullLabel,
      c.classificationStatus,
      c.caseCategoryCode,
      c.caseCategoryName,
      c.plaintiff,
      c.defendant,
      c.status,
      c.archiveCode,
      c.courtDivision,
      c.year,
    ]),
  );
}

export function auditLogsToCsv(
  logs: Array<{
    createdAt: string;
    userName: string;
    action: string;
    description: string;
    entityType: string;
    entityId: string;
  }>,
  truncated: boolean,
): string {
  const comment = truncated
    ? `# Export capped at maximum row limit; results may be truncated.\r\n`
    : "";
  const body = buildCsv(
    ["timestamp", "user", "action", "description", "entity_type", "entity_id"],
    logs.map((log) => [
      log.createdAt,
      log.userName,
      log.action,
      log.description,
      log.entityType,
      log.entityId,
    ]),
  );
  return `${comment}${body}`;
}
