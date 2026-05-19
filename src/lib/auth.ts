import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isMockDataEnabled } from "@/lib/config";
import { mockStore } from "@/lib/data/mock-store";
import { DEMO_PASSWORD, MOCK_USERS } from "@/data/seed/users";
import { mapDbRoleToAppRole } from "@/contracts/users";
import {
  canEditCases as canEditCasesPerm,
  canManageUsers,
  canViewAudit,
  hasPermission,
  isAdmin,
} from "@/types/roles";
import type { UserProfile } from "@/types/user";

export type SessionProfile = UserProfile;

const MOCK_SESSION_COOKIE = "mock_session_user_id";

export async function getSessionProfile(): Promise<SessionProfile | null> {
  if (isMockDataEnabled()) {
    const cookieStore = await cookies();
    const userId = cookieStore.get(MOCK_SESSION_COOKIE)?.value;
    if (!userId) return null;
    return mockStore.getUserById(userId) ?? null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const role = mapDbRoleToAppRole(profile.role as string);

  return {
    id: profile.id,
    fullName: profile.full_name ?? user.email ?? "User",
    email: user.email ?? "",
    role,
    isActive: true,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export async function mockSignIn(email: string, password: string): Promise<{ error?: string }> {
  const user = MOCK_USERS.find((u) => u.email === email);
  if (!user || password !== DEMO_PASSWORD) {
    return { error: "Invalid email or password." };
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
