import { z } from "zod";
import { DOCUMENT_CATEGORIES } from "@/types/document";
import type { CaseDocument } from "@/types/document";
import type { DocumentRow } from "@/types/database";

export const MAX_DOCUMENT_FILE_SIZE = 25 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const documentCategorySchema = z.enum(DOCUMENT_CATEGORIES);

export const scanRegistrationSchema = z.object({
  caseNumber: z.string().trim().min(1, "Case number is required"),
  title: z.string().trim().min(1, "Document title is required"),
  category: documentCategorySchema,
});

export type ScanRegistrationInput = z.infer<typeof scanRegistrationSchema>;

export function documentRowToDto(row: DocumentRow): CaseDocument {
  return {
    id: row.id,
    caseId: row.case_id,
    title: row.title,
    category: "Pleadings",
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    ocrStatus: "pending",
    uploadedBy: row.uploaded_by,
    uploadedByName: null,
    createdAt: row.created_at,
  };
}
