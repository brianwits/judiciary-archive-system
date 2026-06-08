"use server";

import {
  actionError,
  actionOk,
  createRegistryRequestSchema,
  normalizeFieldErrors,
  updateRegistryStatusSchema,
} from "@/contracts";
import { getSessionProfile } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { recordAuditLog, revalidateRegistryMutation } from "@/lib/data/action-helpers";
import { getCaseByNumber } from "@/lib/data";
import { mockStore } from "@/lib/data/mock-store";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/types/roles";

export async function createRegistryRequest(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || !hasPermission(profile.role, "registry_ops")) {
    return actionError("FORBIDDEN", "You do not have permission to create registry requests.");
  }

  const parsed = createRegistryRequestSchema.safeParse({
    caseNumber: formData.get("caseNumber"),
    requestType: formData.get("requestType"),
    requester: formData.get("requester"),
  });

  if (!parsed.success) {
    return actionError(
      "VALIDATION_ERROR",
      "Complete all required registry request fields.",
      normalizeFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  const { caseNumber, requestType, requester } = parsed.data;
  const caseFile = await getCaseByNumber(caseNumber);
  if (!caseFile) {
    return actionError("NOT_FOUND", `Case ${caseNumber} not found.`);
  }

  let requestId: string;

  if (isMockDataEnabled()) {
    const created = mockStore.addRegistryRequest({
      caseNumber: caseFile.caseNumber,
      requestType,
      requester,
      status: "pending",
    });
    requestId = created.id;
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("registry_requests")
      .insert({
        case_id: caseFile.id,
        request_type: requestType,
        requester,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) return actionError("INTERNAL_ERROR", error.message);
    requestId = data.id;
  }

  await recordAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "case_created",
    entityType: "registry_request",
    entityId: requestId,
    description: `Registry request (${requestType}) submitted for ${caseNumber}`,
    metadata: { caseNumber, requestType, requester },
  });

  revalidateRegistryMutation();
  return actionOk({ caseNumber, requestType });
}

export async function updateRegistryRequestStatus(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || !hasPermission(profile.role, "registry_ops")) {
    return actionError("FORBIDDEN", "You do not have permission to update registry requests.");
  }

  const parsed = updateRegistryStatusSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return actionError(
      "VALIDATION_ERROR",
      "Invalid registry request update.",
      normalizeFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  const { requestId, status } = parsed.data;

  let caseNumberForAudit: string = "—";

  if (isMockDataEnabled()) {
    const updated = mockStore.updateRegistryRequest(requestId, { status });
    if (!updated) {
      return actionError("NOT_FOUND", "Registry request not found.");
    }
    caseNumberForAudit = updated.caseNumber;
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("registry_requests")
      .update({ status })
      .eq("id", requestId)
      .select("id, case_id, request_type, requester, status, cases(case_number)")
      .maybeSingle();

    if (error) return actionError("INTERNAL_ERROR", error.message);
    if (!data) return actionError("NOT_FOUND", "Registry request not found.");

    caseNumberForAudit =
      (data.cases as { case_number: string } | null)?.case_number ?? "—";
  }

  await recordAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "case_updated",
    entityType: "registry_request",
    entityId: requestId,
    description: `Registry request for ${caseNumberForAudit} marked ${status.replace("_", " ")}`,
    metadata: { caseNumber: caseNumberForAudit, status },
  });

  revalidateRegistryMutation();
  return actionOk({ requestId, status });
}
