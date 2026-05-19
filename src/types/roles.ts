export const USER_ROLES = [
  "admin",
  "ict_officer",
  "registry_clerk",
  "archivist",
  "deputy_registrar",
  "judge",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  ict_officer: "ICT Officer",
  registry_clerk: "Registry Clerk",
  archivist: "Archivist",
  deputy_registrar: "Deputy Registrar",
  judge: "Judge",
};

export type Permission =
  | "view_cases"
  | "edit_cases"
  | "archive_ops"
  | "file_movement"
  | "upload_docs"
  | "reports"
  | "user_mgmt"
  | "audit_logs"
  | "registry_ops";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view_cases",
    "edit_cases",
    "archive_ops",
    "file_movement",
    "upload_docs",
    "reports",
    "user_mgmt",
    "audit_logs",
    "registry_ops",
  ],
  ict_officer: [
    "view_cases",
    "edit_cases",
    "upload_docs",
    "reports",
    "user_mgmt",
    "audit_logs",
  ],
  registry_clerk: [
    "view_cases",
    "edit_cases",
    "archive_ops",
    "file_movement",
    "upload_docs",
    "reports",
    "registry_ops",
  ],
  archivist: [
    "view_cases",
    "edit_cases",
    "archive_ops",
    "file_movement",
    "upload_docs",
    "reports",
  ],
  deputy_registrar: [
    "view_cases",
    "edit_cases",
    "archive_ops",
    "file_movement",
    "reports",
    "audit_logs",
    "registry_ops",
  ],
  judge: ["view_cases", "file_movement", "reports"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canEditCases(role: UserRole): boolean {
  return hasPermission(role, "edit_cases");
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, "user_mgmt");
}

export function canViewAudit(role: UserRole): boolean {
  return hasPermission(role, "audit_logs");
}
