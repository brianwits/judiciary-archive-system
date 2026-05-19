import { z } from "zod";
import { USER_ROLES, type UserRole } from "@/types/roles";
import type { UserRole as DbUserRole } from "@/types/database";

export const userRoleSchema = z.enum(USER_ROLES);
export const dbUserRoleSchema = z.enum(["admin", "staff", "readonly"]);

export type AppUserRole = z.infer<typeof userRoleSchema>;
export type DatabaseUserRole = z.infer<typeof dbUserRoleSchema>;

export function mapDbRoleToAppRole(role: string): UserRole {
  const map: Record<string, UserRole> = {
    admin: "admin",
    staff: "registry_clerk",
    readonly: "judge",
    ict_officer: "ict_officer",
    registry_clerk: "registry_clerk",
    archivist: "archivist",
    deputy_registrar: "deputy_registrar",
    judge: "judge",
  };
  return map[role] ?? "judge";
}

export function mapAppRoleToDbRole(role: UserRole): DbUserRole {
  if (role === "admin") return "admin";
  if (role === "judge") return "readonly";
  return "staff";
}
