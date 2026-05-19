export const AUDIT_ACTIONS = [
  "login",
  "case_created",
  "case_updated",
  "file_moved",
  "file_archived",
  "document_uploaded",
  "file_missing",
  "role_changed",
  "file_checked_out",
  "file_checked_in",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditLog = {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};
