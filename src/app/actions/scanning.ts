"use server";

import {
  actionError,
  actionOk,
  normalizeFieldErrors,
  scanLookupSchema,
  type ScanLookupInput,
  type ScanLookupResult,
} from "@/contracts";
import { uploadDocument } from "@/app/actions/documents";
import { getSessionProfile } from "@/lib/auth";
import {
  getAuditLogsForCase,
  getCaseById,
  getCaseByScanCode,
  getMovementsByCase,
} from "@/lib/data";
import { recordAuditLog, revalidateScanMutation } from "@/lib/data/action-helpers";
import { hasPermission } from "@/types/roles";

export async function scanCase(input: ScanLookupInput) {
  const profile = await getSessionProfile();
  if (!profile || !hasPermission(profile.role, "upload_docs")) {
    return actionError("FORBIDDEN", "You do not have permission to digitize case files.");
  }

  const parsed = scanLookupSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "VALIDATION_ERROR",
      "Scan or enter a valid case, QR, or archive code.",
      normalizeFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  const lookup = await getCaseByScanCode(parsed.data.code);
  if (!lookup) {
    return actionError("NOT_FOUND", `No case file matches ${parsed.data.code}.`);
  }

  const [recentMovements, auditLogs] = await Promise.all([
    getMovementsByCase(lookup.caseFile.id),
    getAuditLogsForCase(lookup.caseFile.id, lookup.caseFile.caseNumber, {
      page: 1,
      pageSize: 6,
    }),
  ]);

  return actionOk<ScanLookupResult>({
    caseFile: lookup.caseFile,
    matchedBy: lookup.matchedBy,
    recentMovements: recentMovements.slice(0, 5),
    auditLogs,
  });
}

export async function uploadScannedDocument(caseId: string, formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || !hasPermission(profile.role, "upload_docs")) {
    return actionError("FORBIDDEN", "You do not have permission to digitize case files.");
  }

  const caseFile = await getCaseById(caseId);
  if (!caseFile) {
    return actionError("NOT_FOUND", "Case file not found.");
  }

  const result = await uploadDocument(caseId, formData);
  if (!result.ok) return result;

  const title = String(formData.get("title") ?? "Scanned document").trim();
  const category = String(formData.get("category") ?? "Pleadings");
  await recordAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "file_scanned",
    entityType: "case",
    entityId: caseFile.id,
    description: `Digitized ${title} for ${caseFile.caseNumber}`,
    metadata: {
      caseNumber: caseFile.caseNumber,
      title,
      category,
      source: "digital_scanning",
    },
  });

  revalidateScanMutation(caseFile.id);
  return actionOk({ title });
}
