import { normalizeCourtEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow } from "@/types/database";

export type ProfileWithEmail = ProfileRow & {
  email: string | null;
};

const AUTH_USERS_PER_PAGE = 1000;
const AUTH_USERS_MAX_PAGES = 100;

async function listAuthEmailsByUserId() {
  const admin = createAdminClient();
  const emailById = new Map<string, string | null>();

  for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PER_PAGE,
    });

    if (error) throw error;

    for (const user of data.users) {
      emailById.set(user.id, user.email ? normalizeCourtEmail(user.email) : null);
    }

    if (data.users.length < AUTH_USERS_PER_PAGE) break;
  }

  return emailById;
}

export async function listProfilesWithAuthEmails(): Promise<ProfileWithEmail[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);

  const profiles = data ?? [];
  if (profiles.length === 0) return [];

  try {
    const emailById = await listAuthEmailsByUserId();
    return profiles.map((profile) => ({
      ...profile,
      email: emailById.get(profile.id) ?? null,
    }));
  } catch (error) {
    console.error("Admin email merge failed; returning profiles without auth emails.", error);
    return profiles.map((profile) => ({
      ...profile,
      email: null,
    }));
  }
}
