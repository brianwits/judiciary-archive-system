"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  actionError,
  actionOk,
  dbUserRoleSchema,
  normalizeFieldErrors,
  userRoleSchema,
} from "@/contracts";
import { canManageUsers, getSessionProfile } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { mockStore } from "@/lib/data/mock-store";
import { createClient } from "@/lib/supabase/server";
import type { UserRole as DbUserRole } from "@/types/database";

const profileDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  pjNumber: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9 /-]*$/, "Use letters, numbers, spaces, hyphens, or slashes only."),
  department: z.string().trim().max(80),
  role: z.string().trim().min(1, "Role is required."),
});

function profileDetailsFromFormData(formData: FormData) {
  return profileDetailsSchema.safeParse({
    fullName: formData.get("fullName"),
    pjNumber: formData.get("pjNumber"),
    department: formData.get("department"),
    role: formData.get("role"),
  });
}

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

export async function updateUserDetails(userId: string, formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || !canManageUsers(profile.role)) {
    return actionError("UNAUTHORIZED", "Unauthorized");
  }

  const parsed = profileDetailsFromFormData(formData);
  if (!parsed.success) {
    return actionError(
      "VALIDATION_ERROR",
      "Check the user details and try again.",
      normalizeFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  const input = parsed.data;

  if (isMockDataEnabled()) {
    const parsedRole = userRoleSchema.safeParse(input.role);
    if (!parsedRole.success) {
      return actionError("VALIDATION_ERROR", "Invalid user role.", {
        role: parsedRole.error.flatten().formErrors,
      });
    }

    if (userId === profile.id && parsedRole.data !== "admin") {
      return actionError("FORBIDDEN", "You cannot remove your own admin access.");
    }

    const updated = mockStore.updateUser(userId, {
      fullName: input.fullName,
      pjNumber: input.pjNumber || null,
      department: input.department || null,
      role: parsedRole.data,
    });
    if (!updated) return actionError("NOT_FOUND", "User not found.");

    revalidatePath("/users");
    revalidatePath("/admin/users");
    return actionOk();
  }

  const parsedRole = dbUserRoleSchema.safeParse(input.role);
  if (!parsedRole.success) {
    return actionError("VALIDATION_ERROR", "Invalid user role.", {
      role: parsedRole.error.flatten().formErrors,
    });
  }

  if (userId === profile.id && parsedRole.data !== "admin") {
    return actionError("FORBIDDEN", "You cannot remove your own admin access.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      pj_number: input.pjNumber || null,
      department: input.department || null,
      role: parsedRole.data,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) return actionError("BAD_REQUEST", error.message);
  if (!data) return actionError("NOT_FOUND", "User not found.");

  revalidatePath("/users");
  revalidatePath("/admin/users");
  return actionOk();
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

  if (userId === profile.id && parsedRole.data !== "admin") {
    return actionError("FORBIDDEN", "You cannot remove your own admin access.");
  }

  const updated = mockStore.updateUser(userId, { role: parsedRole.data });
  if (!updated) return actionError("NOT_FOUND", "User not found.");

  revalidatePath("/users");
  revalidatePath("/admin/users");
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
