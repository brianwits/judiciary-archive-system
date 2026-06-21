import { cookies } from "next/headers";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileRowForUser } from "@/lib/supabase/fetch-profile";
import { isMockDataEnabled } from "@/lib/config";
import { mockStore } from "@/lib/data/mock-store";
import { DEMO_PASSWORD, MOCK_USERS } from "@/data/seed/users";
import { normalizeCourtEmail } from "@/lib/email";
import { parseNotificationPreferences } from "@/types/notification";
import { mapDbRoleToAppRole } from "@/lib/roles/map-db-role";
import {
  canEditCases as canEditCasesPerm,
  canManageUsers,
  canViewAudit,
  hasPermission,
  isAdmin,
} from "@/types/roles";
import type { UserProfile } from "@/types/user";

export type SessionProfile = UserProfile;

export const MOCK_SESSION_COOKIE = "mock_session_user_id";

export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  if (isMockDataEnabled()) {
    const cookieStore = await cookies();
    const userId = cookieStore.get(MOCK_SESSION_COOKIE)?.value;
    if (!userId) return null;
    const profile = mockStore.getUserById(userId);
    if (!profile || !profile.isActive) return null;
    return profile;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profileResult = await fetchProfileRowForUser(supabase, user.id);
  if (profileResult.status === "error") {
    throw new Error(profileResult.error.message);
  }
  if (profileResult.status === "missing") return null;

  const profile = profileResult.profile;
  if (!profile.is_active) return null;

  const role = mapDbRoleToAppRole(profile.role as string);

  return {
    id: profile.id,
    fullName: profile.full_name ?? user.email ?? "User",
    email: normalizeCourtEmail(user.email ?? ""),
    pjNumber: profile.pj_number ?? null,
    department: profile.department ?? null,
    role,
    isActive: profile.is_active ?? true,
    notificationPreferences: parseNotificationPreferences(profile.notification_preferences),
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
});

export async function mockSignIn(email: string, password: string): Promise<{ error?: string }> {
  const normalizedEmail = normalizeCourtEmail(email);
  const user = MOCK_USERS.find((u) => normalizeCourtEmail(u.email) === normalizedEmail);
  if (!user || password !== (user.password ?? DEMO_PASSWORD)) {
    return { error: "Invalid email or password." };
  }
  if (!user.isActive) {
    return { error: "This account has been deactivated." };
  }
  const cookieStore = await cookies();
  cookieStore.set(MOCK_SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return {};
}

export async function mockSignOut() {
  const cookieStore = await cookies();
  cookieStore.delete(MOCK_SESSION_COOKIE);
}

export { canEditCasesPerm as canEditCases, canManageUsers, canViewAudit, hasPermission, isAdmin };
