import type { CourtUserRole } from "@/types/database";
import { USER_ROLES, type UserRole } from "@/types/roles";

const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  admin: "admin",
  staff: "registry_clerk",
  readonly: "judge",
};

/** Maps DB/profile role strings to app roles. Zod-free for server/middleware bundles. */
export function mapDbRoleToAppRole(role: string): UserRole {
  if (USER_ROLES.includes(role as UserRole)) {
    return role as UserRole;
  }
  return LEGACY_ROLE_MAP[role] ?? "judge";
}

export function mapAppRoleToDbRole(role: UserRole): CourtUserRole {
  return role;
}
