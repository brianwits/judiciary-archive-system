export function isMockDataEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
}

export function assertSupabaseConfigured(): void {
  if (isMockDataEnabled()) return;

  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Supabase configuration requires: ${missing.join(", ")} when NEXT_PUBLIC_USE_MOCK_DATA is not "true".`,
    );
  }
}
