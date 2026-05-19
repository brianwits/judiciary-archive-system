"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  actionOk,
  normalizeFieldErrors,
  scanRegistrationSchema,
  type ScanRegistrationInput,
} from "@/contracts";
import { getSessionProfile } from "@/lib/auth";
import { mockStore } from "@/lib/data/mock-store";
import { hasPermission } from "@/types/roles";

export async function uploadDocument(data: ScanRegistrationInput) {
  const profile = await getSessionProfile();
  if (!profile || !hasPermission(profile.role, "upload_docs")) {
    return actionError("FORBIDDEN", "You do not have permission to upload documents.");
  }

  const result = scanRegistrationSchema.safeParse(data);
  if (!result.success) {
    return actionError(
      "VALIDATION_ERROR",
      "Complete all required scan fields.",
      normalizeFieldErrors(result.error.flatten().fieldErrors),
    );
  }

  const input = result.data;
  const caseFile = mockStore.getCaseByNumber(input.caseNumber);
  if (!caseFile) {
    return actionError("NOT_FOUND", `Case ${input.caseNumber} not found.`);
  }

  const doc = mockStore.addDocument({
    caseId: caseFile.id,
    title: input.title,
    category: input.category,
    storagePath: `${caseFile.id}/${input.category.toLowerCase()}/${Date.now()}.pdf`,
    mimeType: "application/pdf",
    fileSize: 0,
    ocrStatus: "pending",
    uploadedBy: profile.id,
    uploadedByName: profile.fullName,
  });

  mockStore.addAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "document_uploaded",
    entityType: "document",
    entityId: doc.id,
    description: `Uploaded ${input.title} for ${caseFile.caseNumber}`,
    metadata: { caseNumber: caseFile.caseNumber, category: input.category },
  });

  revalidatePath("/scanning");
  revalidatePath(`/cases/${caseFile.id}`);
  return actionOk();
}
