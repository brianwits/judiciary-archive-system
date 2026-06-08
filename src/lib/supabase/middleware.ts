import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { mapDbRoleToAppRole } from "@/lib/roles/map-db-role";
import { assertSupabaseConfigured, isMockDataEnabled } from "@/lib/config";
import { permissionRequiredForAppPath } from "@/config/navigation-permissions";
import { mockStore } from "@/lib/data/mock-store";
import { MOCK_SESSION_COOKIE } from "@/lib/auth";
import { hasPermission } from "@/types/roles";
import type { Database, ProfileRow } from "@/types/database";
import {
  ensureProfileRowForCurrentUser,
  fetchProfileRowForUser,
} from "@/lib/supabase/fetch-profile";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLogin = pathname.startsWith("/login");

  if (pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/admin/, "") || "/users";
    if (url.pathname === "/users" || url.pathname.startsWith("/users/")) {
      return NextResponse.redirect(url);
    }
    url.pathname = "/users";
    return NextResponse.redirect(url);
  }

  if (isMockDataEnabled()) {
    const userId = request.cookies.get(MOCK_SESSION_COOKIE)?.value;
    const profile = userId ? mockStore.getUserById(userId) : null;

    if (profile && !profile.isActive) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "inactive_account");
      const response = NextResponse.redirect(url);
      response.cookies.delete(MOCK_SESSION_COOKIE);
      return response;
    }

    if (!profile && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (profile && isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (profile && !isLogin) {
      const required = permissionRequiredForAppPath(pathname);
      if (required && !hasPermission(profile.role, required)) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next({ request });
  }

  assertSupabaseConfigured();

  let supabaseResponse = NextResponse.next({ request });

  /** Preserves refreshed session cookies accumulated on supabaseResponse (e.g. after getUser). */
  const redirectUpdatingSession = (url: URL) => {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  };

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectUpdatingSession(url);
  }

  let profileRow: ProfileRow | null = null;
  if (user) {
    const profileResult = await fetchProfileRowForUser(supabase, user.id);
    if (profileResult.status === "error") {
      console.error("Profile fetch failed in middleware:", profileResult.error.message);
      return supabaseResponse;
    }
    if (profileResult.status === "ok") {
      profileRow = profileResult.profile;
    } else {
      const ensured = await ensureProfileRowForCurrentUser(supabase);
      if (ensured.status === "ok") {
        profileRow = ensured.profile;
      } else if (ensured.status === "error") {
        console.error("Profile ensure failed in middleware:", ensured.error.message);
        return supabaseResponse;
      }
    }
  }

  if (user && profileRow && !profileRow.is_active) {
    await supabase.auth.signOut();

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "inactive_account");
    return redirectUpdatingSession(url);
  }

  if (user && isLogin && profileRow) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return redirectUpdatingSession(url);
  }

  if (user && isLogin && !profileRow) {
    if (request.nextUrl.searchParams.get("error") !== "missing_profile") {
      const url = request.nextUrl.clone();
      url.searchParams.set("error", "missing_profile");
      return redirectUpdatingSession(url);
    }
    return supabaseResponse;
  }

  if (user && !isLogin && !profileRow) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "missing_profile");
    return redirectUpdatingSession(url);
  }

  if (user && profileRow && !isLogin) {
    const role = mapDbRoleToAppRole(profileRow.role as string);
    const required = permissionRequiredForAppPath(pathname);
    if (required && !hasPermission(role, required)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return redirectUpdatingSession(url);
    }
  }

  return supabaseResponse;
}
