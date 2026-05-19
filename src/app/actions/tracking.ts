"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  actionOk,
  checkoutSchema,
  normalizeFieldErrors,
  type CheckoutInput,
} from "@/contracts";
import { getSessionProfile } from "@/lib/auth";
import { mockStore } from "@/lib/data/mock-store";
import { notifyFileMovement } from "@/lib/webhooks/n8n";
import { hasPermission } from "@/types/roles";

export async function checkoutFile(data: CheckoutInput) {
  const profile = await getSessionProfile();
  if (!profile || !hasPermission(profile.role, "file_movement")) {
    return actionError("FORBIDDEN", "You do not have permission to check out files.");
  }

  const result = checkoutSchema.safeParse(data);
  if (!result.success) {
    return actionError(
      "VALIDATION_ERROR",
      "Complete all required checkout fields.",
      normalizeFieldErrors(result.error.flatten().fieldErrors),
    );
  }

  const input = result.data;
  const caseFile = mockStore.getCaseByNumber(input.caseNumber);
  if (!caseFile) {
    return actionError("NOT_FOUND", `Case ${input.caseNumber} not found.`);
  }

  const movement = mockStore.addMovement({
    caseId: caseFile.id,
    caseNumber: caseFile.caseNumber,
    caseTitle: `${caseFile.plaintiff} v. ${caseFile.defendant}`,
    checkedOutBy: profile.id,
    checkedOutByName: profile.fullName,
    destinationOffice: input.destinationOffice,
    purpose: input.purpose,
    expectedReturnDate: input.expectedReturnDate,
    actualReturnDate: null,
    status: "checked_out",
  });

  mockStore.addAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "file_checked_out",
    entityType: "movement",
    entityId: movement.id,
    description: `Checked out ${caseFile.caseNumber} to ${input.destinationOffice}`,
    metadata: { caseNumber: caseFile.caseNumber },
  });

  await notifyFileMovement({
    type: "checkout",
    caseNumber: caseFile.caseNumber,
    destination: input.destinationOffice,
    user: profile.fullName,
  });

  revalidatePath("/tracking");
  revalidatePath("/");
  return actionOk();
}

export async function checkinFile(movementId: string) {
  const profile = await getSessionProfile();
  if (!profile || !hasPermission(profile.role, "file_movement")) {
    return actionError("FORBIDDEN", "You do not have permission to check in files.");
  }

  const movement = mockStore.updateMovement(movementId, {
    status: "returned",
    actualReturnDate: new Date().toISOString().slice(0, 10),
  });

  if (!movement) {
    return actionError("NOT_FOUND", "Movement record not found.");
  }

  mockStore.addAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "file_checked_in",
    entityType: "movement",
    entityId: movement.id,
    description: `Returned ${movement.caseNumber} to archive`,
    metadata: { caseNumber: movement.caseNumber },
  });

  await notifyFileMovement({
    type: "checkin",
    caseNumber: movement.caseNumber,
    destination: movement.destinationOffice,
    user: profile.fullName,
  });

  revalidatePath("/tracking");
  revalidatePath("/");
  return actionOk();
}
