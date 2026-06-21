"use server";

import { unstable_cache } from "next/cache";
import { z } from "zod";
import {
  actionError,
  actionOk,
  dbUserRoleSchema,
  normalizeFieldErrors,
  userRoleSchema,
  type ProfileListItem,
} from "@/contracts";
import { canManageUsers, getSessionProfile } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { revalidateUserMutation } from "@/lib/data/action-helpers";
import { mockStore } from "@/lib/data/mock-store";
import { normalizeCourtEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordAuditLog } from "@/lib/data/action-helpers";
import type { CourtUserRole } from "@/types/database";

const emailSchema = z
  .string()
  .trim()
  .transform((value) => normalizeCourtEmail(value))
  .pipe(z.string().email("Please enter a valid email address.").max(320));

const profileDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  pjNumber: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9 /-]*$/, "Use letters, numbers, spaces, hyphens, or slashes only."),
  department: z.string().trim().max(80),
  role: z.string().trim().min(1, "Role is required."),
  email: z.string().trim().max(320).optional(),
});

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  email: z.string().trim().min(1, "Email is required.").max(320),
  password: z.string().trim().min(6, "Password must be at least 6 characters.").max(128),
  pjNumber: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9 /-]*$/, "Use letters, numbers, spaces, hyphens, or slashes only."),
  department: z.string().trim().max(80),
  role: z.string().trim().min(1, "Role is required."),
});

const userSummarySelect = "id, full_name, role";

function normalizeEmailInput(email: string | null | undefined): string {
  return normalizeCourtEmail(String(email ?? ""));
}

function profileDetailsFromFormData(formData: FormData) {
  const emailRaw = String(formData.get("email") ?? "").trim();
  return profileDetailsSchema.safeParse({
    fullName: formData.get("fullName"),
    pjNumber: formData.get("pjNumber"),
    department: formData.get("department"),
    role: formData.get("role"),
    email: emailRaw ? normalizeCourtEmail(emailRaw) : undefined,
  });
}

function createUserFromFormData(formData: FormData) {
  return createUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    pjNumber: formData.get("pjNumber"),
    department: formData.get("department"),
    role: formData.get("role"),
  });
}

async function countManagedUsersMock() {
  return mockStore.getUsers().filter((u) => canManageUsers(u.role)).length;
}

const listProfilesCached = unstable_cache(
  async (): Promise<ProfileListItem[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) throw new Error(error.message);

    const profiles = data ?? [];
    if (profiles.length === 0) return [];

    try {
      const emailById = new Map<string, string | null>();
      const perPage = 1000;

      // Paginate: single-page listUsers capped at `perPage` would drop emails beyond the first page.
      // Cap pages to guard against accidental infinite loops.
      for (let page = 1; page <= 100; page += 1) {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
          page,
          perPage,
        });

        if (authError) throw authError;

        for (const user of authData.users) {
          emailById.set(user.id, user.email ?? null);
        }

        if (authData.users.length < perPage) break;
      }

      return profiles.map((row) => ({
        ...row,
        email: emailById.get(row.id) ? normalizeEmailInput(emailById.get(row.id)) : null,
      }));
    } catch {
      return profiles.map((row) => ({
        ...row,
        email: null,
      }));
    }
  },
  ["admin-profiles-list"],
  {
    revalidate: 300,
    tags: [CACHE_TAGS.users],
  },
);

export async function listProfiles(): Promise<ProfileListItem[]> {
  const profile = await getSessionProfile();
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error("Unauthorized");
  }

  return listProfilesCached();
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

    const targetUser = mockStore.getUserById(userId);
    if (!targetUser) return actionError("NOT_FOUND", "User not found.");

    const previousEmail = targetUser.email;

    const updated = mockStore.updateUser(userId, {
      fullName: input.fullName,
      pjNumber: input.pjNumber || null,
      department: input.department || null,
      role: parsedRole.data,
      email: input.email || undefined,
    });
    if (!updated) return actionError("NOT_FOUND", "User not found.");

    if (input.email && input.email !== previousEmail) {
      await recordAuditLog({
        userId: profile.id,
        userName: profile.fullName,
        action: "user_email_updated",
        entityType: "user",
        entityId: userId,
        description: `Updated email for ${input.fullName} from ${previousEmail} to ${input.email}`,
        metadata: { previousEmail, newEmail: input.email },
      });
    }

    revalidateUserMutation();
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

  // Update email in auth if provided
  if (input.email) {
    try {
      const adminClient = createAdminClient();
      const { error: emailError } = await adminClient.auth.admin.updateUserById(userId, {
        email: input.email,
      });
      if (emailError) {
        console.error("Email update failed (profile changes saved):", emailError.message);
      } else {
        await recordAuditLog({
          userId: profile.id,
          userName: profile.fullName,
          action: "user_email_updated",
          entityType: "user",
          entityId: userId,
          description: `Updated email to ${input.email}`,
          metadata: { newEmail: input.email },
        });
      }
    } catch (e) {
      console.error("Email update failed (profile changes saved):", e);
    }
  }

  revalidateUserMutation();
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

  revalidateUserMutation();
  return actionOk();
}

export async function updateUserEmail(userId: string, formData: FormData) {
  const actingProfile = await getSessionProfile();
  if (!actingProfile || !canManageUsers(actingProfile.role)) {
    return actionError("UNAUTHORIZED", "Unauthorized");
  }

  const emailRaw = String(formData.get("email") ?? "").trim();
  const parsed = emailSchema.safeParse(emailRaw);
  if (!parsed.success) {
    return actionError(
      "VALIDATION_ERROR",
      "Invalid email address.",
    );
  }

  const newEmail = parsed.data;

  // Use the service role client so admins can change email addresses
  const adminClient = createAdminClient();

  if (isMockDataEnabled()) {
    const targetUser = mockStore.getUserById(userId);
    if (!targetUser) return actionError("NOT_FOUND", "User not found.");

    mockStore.updateUser(userId, {
      email: newEmail,
      updatedAt: new Date().toISOString(),
    });

    await recordAuditLog({
      userId: actingProfile.id,
      userName: actingProfile.fullName,
      action: "user_email_updated",
      entityType: "user",
      entityId: userId,
      description: `Updated email for ${targetUser.fullName} from ${targetUser.email} to ${newEmail}`,
      metadata: { previousEmail: targetUser.email, newEmail },
    });

    revalidateUserMutation();
    return actionOk();
  }

  try {
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      email: newEmail,
    });
    if (error) return actionError("BAD_REQUEST", error.message);
  } catch (e) {
    return actionError(
      "BAD_REQUEST",
      e instanceof Error ? e.message : "Failed to update email.",
    );
  }

  await recordAuditLog({
    userId: actingProfile.id,
    userName: actingProfile.fullName,
    action: "user_email_updated",
    entityType: "user",
    entityId: userId,
    description: `Updated email for user ${userId} to ${newEmail}`,
    metadata: { newEmail },
  });

  revalidateUserMutation();
  return actionOk();
}

export async function updateUserRole(userId: string, role: CourtUserRole) {
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

  revalidateUserMutation();
  return actionOk();
}

export async function createUser(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || !canManageUsers(profile.role)) {
    return actionError("UNAUTHORIZED", "Unauthorized");
  }

  const parsed = createUserFromFormData(formData);
  if (!parsed.success) {
    return actionError(
      "VALIDATION_ERROR",
      "Check the new user details and try again.",
      normalizeFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  const input = parsed.data;
  const normalizedEmail = normalizeEmailInput(input.email);
  const parsedEmail = emailSchema.safeParse(normalizedEmail);
  if (!parsedEmail.success) {
    return actionError("VALIDATION_ERROR", "Invalid email address.", {
      email: parsedEmail.error.flatten().formErrors,
    });
  }

  const parsedRole = dbUserRoleSchema.safeParse(input.role);
  if (!parsedRole.success) {
    return actionError("VALIDATION_ERROR", "Invalid user role.", {
      role: parsedRole.error.flatten().formErrors,
    });
  }

  if (isMockDataEnabled()) {
    if (mockStore.getUserByEmail(normalizedEmail)) {
      return actionError("CONFLICT", "A user with this email already exists.");
    }

    const created = mockStore.createUser({
      fullName: input.fullName,
      email: normalizedEmail,
      password: input.password,
      pjNumber: input.pjNumber || null,
      department: input.department || null,
      role: parsedRole.data,
      isActive: true,
    });

    await recordAuditLog({
      userId: profile.id,
      userName: profile.fullName,
      action: "user_created",
      entityType: "user",
      entityId: created.id,
      description: `Created user ${created.fullName} with role ${created.role}`,
      metadata: { email: created.email, role: created.role },
    });

    revalidateUserMutation();
    return actionOk({ userId: created.id, email: created.email });
  }

  const adminClient = createAdminClient();
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      pj_number: input.pjNumber || undefined,
      department: input.department || undefined,
    },
  });

  if (createError) {
    return actionError("BAD_REQUEST", createError.message);
  }

  const createdUser = created.user;
  if (!createdUser) {
    return actionError("INTERNAL_ERROR", "Unable to create the user.");
  }

  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: createdUser.id,
      full_name: input.fullName,
      pj_number: input.pjNumber || null,
      department: input.department || null,
      role: parsedRole.data,
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await adminClient.auth.admin.deleteUser(createdUser.id);
    return actionError("BAD_REQUEST", profileError.message);
  }

  await recordAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "user_created",
    entityType: "user",
    entityId: createdUser.id,
    description: `Created user ${input.fullName} with role ${parsedRole.data}`,
    metadata: { email: normalizedEmail, role: parsedRole.data },
  });

  revalidateUserMutation();
  return actionOk({ userId: createdUser.id, email: normalizedEmail });
}

export async function deleteUser(userId: string) {
  const profile = await getSessionProfile();
  if (!profile || !canManageUsers(profile.role)) {
    return actionError("UNAUTHORIZED", "Unauthorized");
  }

  if (userId === profile.id) {
    return actionError("FORBIDDEN", "You cannot delete your own account.");
  }

  if (isMockDataEnabled()) {
    const targetUser = mockStore.getUserById(userId);
    if (!targetUser) return actionError("NOT_FOUND", "User not found.");

    if (canManageUsers(targetUser.role)) {
      const managersRemaining = await countManagedUsersMock();
      if (managersRemaining <= 1) {
        return actionError("FORBIDDEN", "At least one admin or ICT officer must remain.");
      }
    }

    const removed = mockStore.deleteUser(userId);
    if (!removed) return actionError("NOT_FOUND", "User not found.");

    await recordAuditLog({
      userId: profile.id,
      userName: profile.fullName,
    action: "user_deleted",
    entityType: "user",
    entityId: userId,
    description: `Deleted user ${targetUser.fullName}`,
    metadata: { role: targetUser.role },
    });

    revalidateUserMutation();
    return actionOk();
  }

  const adminClient = createAdminClient();
  const { data: targetUser, error: fetchError } = await adminClient
    .from("profiles")
    .select(userSummarySelect)
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) return actionError("BAD_REQUEST", fetchError.message);
  if (!targetUser) return actionError("NOT_FOUND", "User not found.");

  if (canManageUsers(targetUser.role as CourtUserRole)) {
    const { count, error: countError } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["admin", "ict_officer"]);

    if (countError) return actionError("BAD_REQUEST", countError.message);
    if ((count ?? 0) <= 1) {
      return actionError("FORBIDDEN", "At least one admin or ICT officer must remain.");
    }
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) return actionError("BAD_REQUEST", deleteError.message);

  await recordAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "user_deleted",
    entityType: "user",
    entityId: userId,
    description: `Deleted user ${targetUser.full_name ?? userId}`,
    metadata: { role: targetUser.role },
  });

  revalidateUserMutation();
  return actionOk();
}
