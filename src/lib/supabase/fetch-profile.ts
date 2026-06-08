import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow } from "@/types/database";

/**
 * Load the app profile row for an auth user — use maybeSingle per Supabase SSR guidance
 * when zero or one row is expected (no fabricated defaults when absent).
 */
export async function fetchProfileRowForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function ensureProfileRowForCurrentUser(
  supabase: SupabaseClient<Database>,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase.rpc("ensure_profile_for_current_user");

  if (error || !data) return null;
  return data;
}
