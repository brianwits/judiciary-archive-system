import { z } from "zod";
import { CASE_STATUSES, CASE_TYPES, COURT_DIVISIONS } from "@/types/case";
import type { CaseRow } from "@/types/database";
import type { CaseFile } from "@/types/case";

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
  return {
    id: row.id,
    caseNumber: row.case_number,
    caseType: "Civil",
    courtStation: "KBT",
    courtDivision: "High Court",
    year: row.filed_date ? new Date(row.filed_date).getFullYear() : new Date(row.created_at).getFullYear(),
    plaintiff: row.title,
    defendant: "",
    judge: "",
    status: row.status,
    archiveCode: row.case_number,
    shelfLocation: null,
    locationId: null,
    qrBarcode: null,
    filedDate: row.filed_date,
    closedDate: row.closed_date,
    notes: row.description,
    isMissing: false,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}
