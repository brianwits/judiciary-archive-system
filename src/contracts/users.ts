import { z } from "zod";
import type { CourtUserRole, ProfileRow } from "@/types/database";
import { USER_ROLES } from "@/types/roles";

export type ProfileListItem = ProfileRow & {
  email: string | null;
};

export const userRoleSchema = z.enum(USER_ROLES);
export const dbUserRoleSchema = userRoleSchema;

export type AppUserRole = z.infer<typeof userRoleSchema>;
export type DatabaseUserRole = CourtUserRole;

export { mapAppRoleToDbRole, mapDbRoleToAppRole } from "@/lib/roles/map-db-role";
