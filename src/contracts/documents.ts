import { z } from "zod";
import { DOCUMENT_CATEGORIES } from "@/types/document";
import type { CaseDocument, DocumentCategory } from "@/types/document";
import type { DocumentRow } from "@/types/database";

export const MAX_DOCUMENT_FILE_SIZE = 25 * 1024 * 1024;

/** Matches {@link MAX_DOCUMENT_FILE_SIZE}; use in UI/errors so limits stay aligned. */
export const MAX_DOCUMENT_FILE_SIZE_LABEL = `${MAX_DOCUMENT_FILE_SIZE / (1024 * 1024)} MB`;

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const documentCategorySchema = z.enum(DOCUMENT_CATEGORIES);

export function documentRowToDto(
  row: DocumentRow,
  uploadedByName?: string | null,
): CaseDocument {
  return {
    id: row.id,
    caseId: row.case_id,
    title: row.title,
    category: (row.category ?? "Pleadings") as DocumentCategory,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    ocrStatus: row.ocr_status ?? "pending",
    uploadedBy: row.uploaded_by,
    uploadedByName: uploadedByName ?? null,
    createdAt: row.created_at,
  };
}
