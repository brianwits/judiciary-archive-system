export const DOCUMENT_CATEGORIES = [
  "Pleadings",
  "Proceedings",
  "Rulings",
  "Orders",
  "Correspondence",
  "Exhibits",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const OCR_STATUSES = ["pending", "processing", "complete", "failed"] as const;
export type OcrStatus = (typeof OCR_STATUSES)[number];

export type CaseDocument = {
  id: string;
  caseId: string;
  title: string;
  category: DocumentCategory;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  ocrStatus: OcrStatus;
  uploadedBy: string | null;
  uploadedByName: string | null;
  createdAt: string;
};
