"use server";

import { redirect } from "next/navigation";
import { actionError, actionOk } from "@/contracts/result";
import { mockSignIn, mockSignOut } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
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
