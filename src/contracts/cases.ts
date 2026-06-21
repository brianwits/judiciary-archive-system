import { z } from "zod";
import { getCaseCategoryCode, getCaseCategoryLabel } from "@/lib/case-category";
import { canonicalizeCaseNumberWithPrefix } from "@/lib/case-number";
import { getCaseTypeDefinition, legacyCaseTypeForFamily, resolveCaseType } from "@/lib/case-type";
import { CASE_STATUSES, CASE_TYPES, COURT_DIVISIONS } from "@/types/case";
import type { CaseRow } from "@/types/database";
import type { CaseFile, CaseType, CourtDivision, CourtStation } from "@/types/case";

export { resolveCaseType } from "@/lib/case-type";

export const caseStatusSchema = z.enum(CASE_STATUSES);
export const caseTypeSchema = z.enum(CASE_TYPES);
export const courtDivisionSchema = z.enum(COURT_DIVISIONS);

export const caseFiltersSchema = z.object({
  q: z.string().trim().optional(),
  caseType: caseTypeSchema.optional(),
  caseTypeId: z.coerce.number().int().positive().optional(),
  caseFamily: z.string().trim().optional(),
  year: z.coerce.number().int().min(1900).max(3000).optional(),
  status: caseStatusSchema.optional(),
  courtDivision: courtDivisionSchema.optional(),
  partyName: z.string().trim().optional(),
});

export const caseFormSchema = z.object({
  caseNumber: z.string().trim().min(1, "Case number is required."),
  title: z.string().trim().min(1, "Title is required."),
  court: z.string().trim().optional().default(""),
  caseTypeId: z.coerce.number().int().positive("Case type is required."),
  status: z.enum(["open", "closed", "archived"]).default("open"),
  filedDate: z.string().trim().optional().nullable(),
  closedDate: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

export type CaseFiltersContract = z.infer<typeof caseFiltersSchema>;
export type CaseFormInput = {
  caseNumber: string;
  title: string;
  court: string;
  caseTypeId: number;
  caseTypeCode: string;
  caseTypeName: string;
  caseTypeFullLabel: string;
  caseFamily: string;
  courtLevel: string;
  caseType: CaseType;
  status: "open" | "closed" | "archived";
  filedDate: string | null;
  closedDate: string | null;
  description: string | null;
};
export type CaseDto = CaseFile;

export const bulkUpdateCaseStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Select at least one case.").max(50),
  status: caseStatusSchema,
});

export const bulkDeleteCasesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Select at least one case.").max(50),
});

export type BulkUpdateCaseStatusInput = z.infer<typeof bulkUpdateCaseStatusSchema>;
export type BulkDeleteCasesInput = z.infer<typeof bulkDeleteCasesSchema>;

export function caseFormDataToInput(formData: FormData): CaseFormInput {
  const parsed = caseFormSchema.parse({
    caseNumber: formData.get("case_number"),
    title: formData.get("title"),
    court: formData.get("court"),
    caseTypeId: formData.get("case_type_id"),
    status: formData.get("status"),
    filedDate: emptyToNull(formData.get("filed_date")),
    closedDate: emptyToNull(formData.get("closed_date")),
    description: emptyToNull(formData.get("description")),
  });

  const definition = getCaseTypeDefinition(parsed.caseTypeId);
  if (!definition?.active) {
    throw new z.ZodError([
      { code: "custom", path: ["caseTypeId"], message: "Select an active case type." },
    ]);
  }
  const caseNumber = canonicalizeCaseNumberWithPrefix(parsed.caseNumber, definition.code);

  return {
    caseNumber,
    title: parsed.title,
    court: parsed.court ?? "",
    caseTypeId: definition.caseTypeId,
    caseTypeCode: definition.code,
    caseTypeName: definition.caseType,
    caseTypeFullLabel: definition.fullLabel,
    caseFamily: definition.caseFamily,
    courtLevel: definition.courtLevel,
    caseType: legacyCaseTypeForFamily(definition.caseFamily),
    status: parsed.status,
    filedDate: parsed.filedDate ?? null,
    closedDate: parsed.closedDate ?? null,
    description: parsed.description ?? null,
  };
}

export function caseRowToDto(row: CaseRow): CaseDto {
  const definition = getCaseTypeDefinition(row.case_type_id);
  const caseCategoryCode = getCaseCategoryCode(row.case_category_code, row.case_number, {
    caseType: resolveCaseType(row.case_type, row.case_number),
    courtDivision: row.court_division,
  });
  const caseType = resolveCaseType(row.case_type, row.case_number);
  const courtStation = parseCourtStation(row.court_station ?? row.court);
  const courtDivision = parseCourtDivision(row.court_division, caseType);
  const year =
    row.year ??
    (row.filed_date
      ? new Date(row.filed_date).getFullYear()
      : new Date(row.created_at).getFullYear());

  return {
    id: row.id,
    caseNumber: row.case_number,
    caseType,
    caseTypeId: definition?.caseTypeId ?? null,
    caseTypeCode: definition?.code ?? caseCategoryCode,
    caseTypeName: definition?.caseType ?? getCaseCategoryLabel(caseCategoryCode),
    caseTypeFullLabel: definition?.fullLabel ?? getCaseCategoryLabel(caseCategoryCode),
    caseFamily: definition?.caseFamily ?? row.case_family ?? caseType,
    caseCourtLevel: definition?.courtLevel ?? courtDivision,
    classificationStatus: definition
      ? "canonical"
      : row.case_category_code
        ? "legacy"
        : "pending_review",
    caseCategoryCode,
    caseCategoryName: getCaseCategoryLabel(caseCategoryCode),
    courtStation,
    courtDivision,
    year,
    plaintiff: row.plaintiff ?? row.title,
    defendant: row.defendant ?? "",
    judge: row.judge ?? "",
    status: row.status,
    archiveCode: row.archive_code ?? row.case_number,
    shelfLocation: row.shelf_location,
    locationId: row.location_id,
    qrBarcode: row.qr_barcode,
    filedDate: row.filed_date,
    closedDate: row.closed_date,
    notes: row.notes ?? row.description,
    isMissing: row.is_missing ?? row.status === "missing",
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseCourtStation(value: string | null): CourtStation {
  const normalized = (value ?? "KBT").trim().toUpperCase();
  if (["KBT", "NRB", "MSA", "KSM", "NKR"].includes(normalized)) {
    return normalized as CourtStation;
  }
  return "KBT";
}

function parseCourtDivision(value: string | null, caseType: CaseType): CourtDivision {
  if (value && COURT_DIVISIONS.includes(value as CourtDivision)) {
    return value as CourtDivision;
  }
  if (caseType === "ELC") return "Environment & Land";
  if (caseType === "Family") return "Family Division";
  if (caseType === "Commercial") return "Commercial Division";
  if (caseType === "Traffic" || caseType === "Succession") return "Magistrate Court";
  return "High Court";
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}
