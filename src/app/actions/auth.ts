"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { actionError, actionOk } from "@/contracts/result";
import { mockSignIn, mockSignOut } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { allowRateLimited, forwardedOrRealIp } from "@/lib/rate-limit";
import { ensureProfileRowForCurrentUser } from "@/lib/supabase/fetch-profile";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const headerList = await headers();
  const clientIp = forwardedOrRealIp(
    headerList.get("x-forwarded-for"),
    headerList.get("x-real-ip"),
  );
  if (!allowRateLimited(`sign-in:${clientIp}`, { max: 30, windowMs: 60_000 })) {
    return actionError("TOO_MANY_REQUESTS", "Too many sign-in attempts. Try again shortly.");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (isMockDataEnabled()) {
    const result = await mockSignIn(email, password);
    if (result.error) {
      return actionError("UNAUTHORIZED", result.error);
    }
    return actionOk();
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return actionError("UNAUTHORIZED", error.message);
  }

  const profileResult = await ensureProfileRowForCurrentUser(supabase);
  if (profileResult.status === "error") {
    await supabase.auth.signOut();
    return actionError(
      "UNAUTHORIZED",
      "Unable to verify your staff profile. Try again shortly.",
    );
  }
  if (profileResult.status === "missing") {
    await supabase.auth.signOut();
    return actionError(
      "UNAUTHORIZED",
      "Unable to link this account to a staff profile. Contact an administrator.",
    );
  }

  const profile = profileResult.profile;
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return actionError("UNAUTHORIZED", "This account has been deactivated.");
  }

  return actionOk();
}

export async function signOut() {
  if (isMockDataEnabled()) {
    await mockSignOut();
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
