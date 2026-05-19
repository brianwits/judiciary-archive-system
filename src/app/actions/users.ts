"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionOk, dbUserRoleSchema, userRoleSchema } from "@/contracts";
import { canManageUsers, getSessionProfile } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { mockStore } from "@/lib/data/mock-store";
import { createClient } from "@/lib/supabase/server";
import type { UserRole as DbUserRole } from "@/types/database";

export async function listProfiles() {
  const profile = await getSessionProfile();
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateMockUserRole(userId: string, role: string) {
  const profile = await getSessionProfile();
  if (!profile || !canManageUsers(profile.role)) {
    return actionError("UNAUTHORIZED", "Unauthorized");
  }

  if (!isMockDataEnabled()) {
    return actionError("BAD_REQUEST", "Mock user updates are only available in demo mode.");
  }

  const parsedRole = userRoleSchema.safeParse(role);
  if (!parsedRole.success) {
    return actionError("VALIDATION_ERROR", "Invalid user role.", {
      role: parsedRole.error.flatten().formErrors,
    });
  }

  const updated = mockStore.updateUser(userId, { role: parsedRole.data });
  if (!updated) return actionError("NOT_FOUND", "User not found.");

  revalidatePath("/users");
  return actionOk();
}

export async function updateUserRole(userId: string, role: DbUserRole) {
  const profile = await getSessionProfile();
  if (!profile || !canManageUsers(profile.role)) {
    return actionError("UNAUTHORIZED", "Unauthorized");
  }

  if (userId === profile.id && role !== "admin") {
    return actionError("FORBIDDEN", "You cannot remove your own admin access.");
  }

  const parsedRole = dbUserRoleSchema.safeParse(role);
  if (!parsedRole.success) {
    return actionError("VALIDATION_ERROR", "Invalid user role.", {
      role: parsedRole.error.flatten().formErrors,
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_user_role", {
    target_user_id: userId,
    new_role: parsedRole.data,
  });

  if (error) return actionError("BAD_REQUEST", error.message);

  revalidatePath("/users");
  revalidatePath("/admin/users");
  return actionOk();
}
