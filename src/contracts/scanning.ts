import { z } from "zod";
import type { AuditLog } from "@/types/audit";
import type { CaseFile } from "@/types/case";
import type { FileMovement } from "@/types/movement";

export const SCAN_CODE_MAX_LENGTH = 120;

export const scanLookupSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Scan or enter a case, QR, or archive code.")
    .max(SCAN_CODE_MAX_LENGTH, "Scan code is too long."),
});

export const SCAN_MATCH_TYPES = [
  "case_number",
  "case_number_alias",
  "qr_barcode",
  "archive_code",
] as const;

export type ScanLookupInput = z.infer<typeof scanLookupSchema>;
export type ScanMatchType = (typeof SCAN_MATCH_TYPES)[number];

export type ScanLookupResult = {
  caseFile: CaseFile;
  matchedBy: ScanMatchType;
  recentMovements: FileMovement[];
  auditLogs: AuditLog[];
};

export function normalizeScanCode(value: string): string {
  return value.trim();
}
