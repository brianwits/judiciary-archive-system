/**
 * Shared helpers for Server Actions — deduplicate mock/real data access & revalidation.
 *
 * Every action in this project follows the same pattern:
 *   1. Auth / permission check
 *   2. Input validation (Zod)
 *   3. Mock-or-real data mutation
 *   4. Audit log (mock or real)
 *   5. Revalidation
 *   6. Return result
 *
 * This module extracts steps 4–5 into reusable helpers so each action body is ~40 % shorter.
 */
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS, caseTag } from "@/lib/data/cache-tags";
import { insertAuditLog } from "@/lib/data/supabase-queries";
import { isMockDataEnabled } from "@/lib/config";
import { mockStore } from "@/lib/data/mock-store";
import type { AuditAction } from "@/types/audit";

// ---------------------------------------------------------------------------
// Audit logging
// ---------------------------------------------------------------------------

export type AuditEntry = {
  userId: string;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
};

/** Write an audit log row regardless of mock/real mode. */
export async function recordAuditLog(entry: AuditEntry): Promise<void> {
  if (isMockDataEnabled()) {
    mockStore.addAuditLog({
      userId: entry.userId,
      userName: entry.userName,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      description: entry.description,
      metadata: entry.metadata ?? {},
    });
  } else {
    await insertAuditLog({
      userId: entry.userId,
      userName: entry.userName,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      description: entry.description,
      metadata: entry.metadata ?? {},
    });
  }
}

// ---------------------------------------------------------------------------
// Revalidation helpers – each domain has a consistent set of paths/tags to purge
// ---------------------------------------------------------------------------

/** Revalidate everything affected by a case create / update / delete. */
export function revalidateCaseMutation(caseId?: string): void {
  revalidatePath("/");
  revalidatePath("/cases");
  if (caseId) revalidatePath(`/cases/${caseId}`);
  revalidateTag(CACHE_TAGS.cases, "max");
  revalidateTag(CACHE_TAGS.archive, "max");
  revalidateTag(CACHE_TAGS.dashboard, "max");
  revalidateTag(CACHE_TAGS.reports, "max");
  revalidateTag(CACHE_TAGS.audit, "max");
  if (caseId) revalidateTag(caseTag(caseId), "max");
}

/** Revalidate everything affected by check-out / check-in. */
export function revalidateTrackingMutation(caseId?: string): void {
  revalidatePath("/tracking");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.movements, "max");
  revalidateTag(CACHE_TAGS.dashboard, "max");
  revalidateTag(CACHE_TAGS.reports, "max");
  revalidateTag(CACHE_TAGS.cases, "max");
  revalidateTag(CACHE_TAGS.audit, "max");
  if (caseId) revalidateTag(caseTag(caseId), "max");
}

/** Revalidate everything affected by registry ops. */
export function revalidateRegistryMutation(): void {
  revalidatePath("/registry");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.dashboard, "max");
  revalidateTag(CACHE_TAGS.audit, "max");
}

/** Revalidate everything affected by document upload / delete. */
export function revalidateDocumentMutation(caseId: string): void {
  revalidatePath(`/cases/${caseId}`);
  revalidateTag(CACHE_TAGS.documents, "max");
  revalidateTag(CACHE_TAGS.dashboard, "max");
  revalidateTag(CACHE_TAGS.reports, "max");
  revalidateTag(CACHE_TAGS.audit, "max");
  revalidateTag(caseTag(caseId), "max");
}

/** Revalidate everything affected by user profile changes. */
export function revalidateUserMutation(): void {
  revalidatePath("/users");
  revalidatePath("/admin/users");
  revalidateTag(CACHE_TAGS.users, "max");
  revalidateTag(CACHE_TAGS.dashboard, "max");
}
