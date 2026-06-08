import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow } from "@/types/database";

export type ProfileFetchResult =
  | { status: "ok"; profile: ProfileRow }
  | { status: "missing" }
  | { status: "error"; error: PostgrestError };

export type ProfileEnsureResult =
  | { status: "ok"; profile: ProfileRow }
  | { status: "missing" }
  | { status: "error"; error: PostgrestError };

/**
 * Load the app profile row for an auth user — use maybeSingle per Supabase SSR guidance
 * when zero or one row is expected (no fabricated defaults when absent).
 */
export async function fetchProfileRowForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileFetchResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { status: "error", error };
  if (!data) return { status: "missing" };
  return { status: "ok", profile: data };
}

export async function ensureProfileRowForCurrentUser(
  supabase: SupabaseClient<Database>,
): Promise<ProfileEnsureResult> {
  const { data, error } = await supabase.rpc("ensure_profile_for_current_user");

  if (error) return { status: "error", error };
  if (!data) return { status: "missing" };
  return { status: "ok", profile: data };
}
