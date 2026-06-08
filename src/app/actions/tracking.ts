"use server";

import {
  actionError,
  actionOk,
  checkoutSchema,
  normalizeFieldErrors,
  type CheckoutInput,
} from "@/contracts";
import { getSessionProfile } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { recordAuditLog, revalidateTrackingMutation } from "@/lib/data/action-helpers";
import { getCaseByNumber } from "@/lib/data";
import { mockStore } from "@/lib/data/mock-store";
import { createClient } from "@/lib/supabase/server";
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
  const caseFile = isMockDataEnabled()
    ? mockStore.getCaseByNumber(input.caseNumber)
    : await getCaseByNumber(input.caseNumber);

  if (!caseFile) {
    return actionError("NOT_FOUND", `Case ${input.caseNumber} not found.`);
  }

  if (isMockDataEnabled()) {
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

    await recordAuditLog({
      userId: profile.id,
      userName: profile.fullName,
      action: "file_checked_out",
      entityType: "movement",
      entityId: movement.id,
      description: `Checked out ${caseFile.caseNumber} to ${input.destinationOffice}`,
      metadata: { caseNumber: caseFile.caseNumber },
    });
  } else {
    const supabase = await createClient();
    const { data: movement, error } = await supabase
      .from("file_movements")
      .insert({
        case_id: caseFile.id,
        checked_out_by: profile.id,
        destination_office: input.destinationOffice,
        purpose: input.purpose,
        expected_return_date: input.expectedReturnDate,
        status: "checked_out",
      })
      .select("id")
      .single();

    if (error) return actionError("BAD_REQUEST", error.message);

    await recordAuditLog({
      userId: profile.id,
      userName: profile.fullName,
      action: "file_checked_out",
      entityType: "movement",
      entityId: movement.id,
      description: `Checked out ${caseFile.caseNumber} to ${input.destinationOffice}`,
      metadata: { caseNumber: caseFile.caseNumber },
    });
  }

  await notifyFileMovement({
    type: "checkout",
    caseNumber: caseFile.caseNumber,
    destination: input.destinationOffice,
    user: profile.fullName,
  });

  revalidateTrackingMutation(caseFile.id);
  return actionOk();
}

export async function checkinFile(movementId: string) {
  const profile = await getSessionProfile();
  if (!profile || !hasPermission(profile.role, "file_movement")) {
    return actionError("FORBIDDEN", "You do not have permission to check in files.");
  }

  let caseIdToRevalidate: string | null = null;
  let caseNumber: string = "Case";

  if (isMockDataEnabled()) {
    const movement = mockStore.updateMovement(movementId, {
      status: "returned",
      actualReturnDate: new Date().toISOString().slice(0, 10),
    });

    if (!movement) {
      return actionError("NOT_FOUND", "Movement record not found.");
    }
    caseIdToRevalidate = movement.caseId ?? null;
    caseNumber = movement.caseNumber ?? caseNumber;

    await recordAuditLog({
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
  } else {
    const supabase = await createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("file_movements")
      .select("id, case_id, cases(case_number), destination_office")
      .eq("id", movementId)
      .maybeSingle();

    if (fetchError) return actionError("BAD_REQUEST", fetchError.message);
    if (!existing) return actionError("NOT_FOUND", "Movement record not found.");
    caseIdToRevalidate = existing.case_id;

    caseNumber =
      (existing.cases as { case_number: string } | null)?.case_number ?? "Case";

    const { error } = await supabase
      .from("file_movements")
      .update({
        status: "returned",
        actual_return_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", movementId);

    if (error) return actionError("BAD_REQUEST", error.message);

    await recordAuditLog({
      userId: profile.id,
      userName: profile.fullName,
      action: "file_checked_in",
      entityType: "movement",
      entityId: movementId,
      description: `Returned ${caseNumber} to archive`,
      metadata: { caseNumber },
    });

    await notifyFileMovement({
      type: "checkin",
      caseNumber,
      destination: existing.destination_office,
      user: profile.fullName,
    });
  }

  revalidateTrackingMutation(caseIdToRevalidate ?? undefined);
  return actionOk();
}
