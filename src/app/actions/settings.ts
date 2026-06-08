"use server";

import { z } from "zod";
import { actionError, actionOk } from "@/contracts/result";
import { getSessionProfile } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { mockStore } from "@/lib/data/mock-store";
import type { Json } from "@/types/database";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  parseNotificationPreferences,
  type NotificationPreferences,
} from "@/types/notification";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be at most 128 characters."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

export async function changePassword(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) {
    return actionError("UNAUTHORIZED", "You must be signed in to change your password.");
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return actionError("VALIDATION_ERROR", "Check the form and try again.", fieldErrors);
  }

  const { currentPassword, newPassword } = parsed.data;

  if (isMockDataEnabled()) {
    // In mock mode, verify current password against the demo password
    const user = mockStore.getUserById(profile.id);
    if (!user) {
      return actionError("NOT_FOUND", "User not found.");
    }

    const DEMO_PASSWORD = "demo1234";
    if (currentPassword !== DEMO_PASSWORD) {
      return actionError("FORBIDDEN", "Current password is incorrect.");
    }

    // In mock mode we don't actually change the password — simulate success
    await new Promise((resolve) => setTimeout(resolve, 300));
    return actionOk();
  }

  // Real Supabase mode
  const supabase = await createClient();

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  });

  if (signInError) {
    return actionError("FORBIDDEN", "Current password is incorrect.");
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return actionError("BAD_REQUEST", updateError.message);
  }

  return actionOk();
}

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const profile = await getSessionProfile();
  if (!profile || isMockDataEnabled()) {
    if (isMockDataEnabled()) {
      const prefs = mockStore.getNotificationPreferences(profile?.id ?? "");
      return prefs ?? { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", profile.id)
    .maybeSingle();

  if (error || !data) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  return parseNotificationPreferences(data.notification_preferences);
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>,
) {
  const profile = await getSessionProfile();
  if (!profile) {
    return actionError("UNAUTHORIZED", "You must be signed in to update notification preferences.");
  }

  if (isMockDataEnabled()) {
    const updated = mockStore.updateNotificationPreferences(profile.id, prefs);
    if (!updated) {
      return actionError("NOT_FOUND", "User not found.");
    }
    return actionOk();
  }

  const supabase = createAdminClient();
  const current = await getNotificationPreferences();
  const merged = { ...current, ...prefs };

  const { error } = await supabase
    .from("profiles")
    .update({ notification_preferences: merged as Json })
    .eq("id", profile.id);

  if (error) {
    return actionError("BAD_REQUEST", error.message);
  }

  return actionOk();
}
