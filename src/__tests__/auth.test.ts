import { describe, it, expect } from "vitest";
import { canEditCases, isAdmin, hasPermission, type UserRole } from "@/types/roles";

/**
 * These tests validate the authorization patterns used across
 * all Server Actions. Every action follows:
 *   1. Profile check
 *   2. Permission check
 *   3. Operation
 */

describe("Server action authorization pattern", () => {
  // Simulates the pattern used in every action file:
  //   const profile = await getSessionProfile();
  //   if (!profile || !canEditCases(profile.role)) {
  //     return actionError("FORBIDDEN", "...");
  //   }
  function authorizeAction(profile: { role: UserRole } | null, check: (role: UserRole) => boolean) {
    if (!profile) return { authorized: false, reason: "No session" };
    if (!check(profile.role)) return { authorized: false, reason: "Insufficient permissions" };
    return { authorized: true, reason: null };
  }

  it("blocks unauthenticated requests", () => {
    const result = authorizeAction(null, canEditCases);
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("No session");
  });

  it("allows admin to edit cases", () => {
    const result = authorizeAction({ role: "admin" }, canEditCases);
    expect(result.authorized).toBe(true);
  });

  it("blocks judge from editing cases", () => {
    const result = authorizeAction({ role: "judge" }, canEditCases);
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("Insufficient permissions");
  });

  it("blocks magistrate from editing cases", () => {
    const result = authorizeAction({ role: "magistrate" }, canEditCases);
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("Insufficient permissions");
  });

  it("blocks judge from deleting documents", () => {
    const result = authorizeAction({ role: "judge" }, isAdmin);
    expect(result.authorized).toBe(false);
  });

  it("allows admin to delete documents", () => {
    const result = authorizeAction({ role: "admin" }, isAdmin);
    expect(result.authorized).toBe(true);
  });

  it("blocks registry_clerk from managing users", () => {
    const result = authorizeAction({ role: "registry_clerk" }, (r) => hasPermission(r, "user_mgmt"));
    expect(result.authorized).toBe(false);
  });

  it("allows ict_officer to manage users", () => {
    const result = authorizeAction({ role: "ict_officer" }, (r) => hasPermission(r, "user_mgmt"));
    expect(result.authorized).toBe(true);
  });
});
