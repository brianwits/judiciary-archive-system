import { z } from "zod";
import { CASE_STATUSES, CASE_TYPES, COURT_DIVISIONS } from "@/types/case";
import type { CaseRow } from "@/types/database";
import type { CaseFile, CaseType, CourtDivision, CourtStation } from "@/types/case";

export const caseStatusSchema = z.enum(CASE_STATUSES);
export const caseTypeSchema = z.enum(CASE_TYPES);
export const courtDivisionSchema = z.enum(COURT_DIVISIONS);

export const caseFiltersSchema = z.object({
  q: z.string().trim().optional(),
  caseType: caseTypeSchema.optional(),
  year: z.coerce.number().int().min(1900).max(3000).optional(),
  status: caseStatusSchema.optional(),
  courtDivision: courtDivisionSchema.optional(),
  partyName: z.string().trim().optional(),
});

export const caseFormSchema = z.object({
  caseNumber: z.string().trim().min(1, "Case number is required."),
  title: z.string().trim().min(1, "Title is required."),
  court: z.string().trim().optional().default(""),
  status: z.enum(["open", "closed", "archived"]).default("open"),
  filedDate: z.string().trim().optional().nullable(),
  closedDate: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

export type CaseFiltersContract = z.infer<typeof caseFiltersSchema>;
export type CaseFormInput = z.infer<typeof caseFormSchema>;
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
  return caseFormSchema.parse({
    caseNumber: formData.get("case_number"),
    title: formData.get("title"),
    court: formData.get("court"),
    status: formData.get("status"),
    filedDate: emptyToNull(formData.get("filed_date")),
    closedDate: emptyToNull(formData.get("closed_date")),
    description: emptyToNull(formData.get("description")),
  });
}

export function caseRowToDto(row: CaseRow): CaseDto {
  const caseType = parseCaseType(row.case_type);
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

function parseCaseType(value: string | null): CaseType {
  if (value && CASE_TYPES.includes(value as CaseType)) {
    return value as CaseType;
  }
  return "Civil";
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
  return "High Court";
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}
