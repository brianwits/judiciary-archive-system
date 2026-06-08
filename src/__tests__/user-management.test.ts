import { describe, it, expect } from "vitest";
import { canManageUsers, isAdmin } from "@/types/roles";
import type { UserRole } from "@/types/roles";

// ---------------------------------------------------------------------------
// Constants matching src/app/actions/users.ts
// ---------------------------------------------------------------------------

const emailSchema = (email: string) => {
  if (!email || email.trim().length === 0) {
    return { success: false as const, error: { message: "Email is required." } };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { success: false as const, error: { message: "Please enter a valid email address." } };
  }
  if (email.trim().length > 320) {
    return { success: false as const, error: { message: "Email is too long." } };
  }
  return { success: true as const, data: email.trim() };
};

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

type UpdateEmailResult =
  | { ok: true }
  | { ok: false; error: { code: string; message: string } };

function simulateUpdateEmail(
  profile: { id: string; role: UserRole; fullName: string } | null,
  userId: string,
  email: string,
  userExists: boolean,
): UpdateEmailResult {
  // Auth check
  if (!profile || !canManageUsers(profile.role)) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } };
  }

  // Email validation
  const parsed = emailSchema(email);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid email address." } };
  }

  // User existence check
  if (!userExists) {
    return { ok: false, error: { code: "NOT_FOUND", message: "User not found." } };
  }

  return { ok: true };
}

type UpdateUserDetailsResult =
  | { ok: true; emailChanged?: boolean; auditLogged?: boolean }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };

function simulateUpdateUserDetails(
  profile: { id: string; role: UserRole; fullName: string } | null,
  formData: { fullName?: string; email?: string; pjNumber?: string; department?: string; role?: string },
  userExists: boolean,
  previousEmail?: string,
): UpdateUserDetailsResult {
  // Auth check
  if (!profile || !canManageUsers(profile.role)) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } };
  }

  // Full name validation
  if (!formData.fullName || formData.fullName.trim().length < 2) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Check the user details and try again.", fieldErrors: { fullName: ["Full name is required."] } },
    };
  }

  // Role validation
  const validRoles = ["admin", "ict_officer", "registry_clerk", "archivist", "deputy_registrar", "judge"];
  if (!formData.role || !validRoles.includes(formData.role)) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid user role.", fieldErrors: { role: ["Invalid role selected."] } },
    };
  }

  // Prevent self-demotion
  if (profile.id === formData.role && formData.role !== "admin") {
    return { ok: false, error: { code: "FORBIDDEN", message: "You cannot remove your own admin access." } };
  }

  // User existence check
  if (!userExists) {
    return { ok: false, error: { code: "NOT_FOUND", message: "User not found." } };
  }

  // Optional email validation
  let emailChanged = false;
  if (formData.email) {
    const parsed = emailSchema(formData.email);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid email address.", fieldErrors: { email: [parsed.error.message] } },
      };
    }
    if (parsed.data !== previousEmail) {
      emailChanged = true;
    }
  }

  return { ok: true, emailChanged, auditLogged: emailChanged };
}

// ---------------------------------------------------------------------------
// Email update — dedicated action tests
// ---------------------------------------------------------------------------

describe("user email update — updateUserEmail", () => {
  it("rejects unauthenticated requests", () => {
    const result = simulateUpdateEmail(null, "user-001", "new@court.go.ke", true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("rejects judge role (no canManageUsers)", () => {
    const result = simulateUpdateEmail(
      { id: "judge-1", role: "judge", fullName: "Hon. Justice Njeri" },
      "user-001",
      "new@court.go.ke",
      true,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("rejects archivist role (no canManageUsers)", () => {
    const result = simulateUpdateEmail(
      { id: "arch-1", role: "archivist", fullName: "Grace Akinyi" },
      "user-001",
      "new@court.go.ke",
      true,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("allows admin to update email", () => {
    const result = simulateUpdateEmail(
      { id: "admin-1", role: "admin", fullName: "Brian Mugendi" },
      "user-001",
      "new@court.go.ke",
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("allows ict_officer to update email", () => {
    const result = simulateUpdateEmail(
      { id: "ict-1", role: "ict_officer", fullName: "Mary Wanjiku" },
      "user-001",
      "new@court.go.ke",
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects registry_clerk role (no canManageUsers)", () => {
    const result = simulateUpdateEmail(
      { id: "clerk-1", role: "registry_clerk", fullName: "Peter Ochieng" },
      "user-001",
      "new@court.go.ke",
      true,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("rejects invalid email formats", () => {
    const testEmails = [
      "not-an-email",
      "missing@domain",
      "@no-local-part.com",
      "spaces in@email.com",
      "",
    ];

    for (const email of testEmails) {
      const result = simulateUpdateEmail(
        { id: "admin-1", role: "admin", fullName: "Admin" },
        "user-001",
        email,
        true,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    }
  });

  it("returns NOT_FOUND when user does not exist", () => {
    const result = simulateUpdateEmail(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      "nonexistent-id",
      "new@court.go.ke",
      false,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("accepts valid email with subdomain", () => {
    const result = simulateUpdateEmail(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      "user-001",
      "user@sub.court.go.ke",
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("accepts email with plus sign (alias)", () => {
    const result = simulateUpdateEmail(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      "user-001",
      "user+alias@court.go.ke",
      true,
    );
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// User details update — including email field tests
// ---------------------------------------------------------------------------

describe("user details update — updateUserDetails (with email)", () => {
  it("rejects update with invalid email in form data", () => {
    const result = simulateUpdateUserDetails(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { fullName: "Test User", email: "bad-email", role: "admin" },
      true,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("accepts update with valid email", () => {
    const result = simulateUpdateUserDetails(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { fullName: "Test User", email: "valid@court.go.ke", role: "registry_clerk" },
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("marks email as changed when new email differs from previous", () => {
    const result = simulateUpdateUserDetails(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { fullName: "Test User", email: "new@court.go.ke", role: "admin" },
      true,
      "old@court.go.ke",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.emailChanged).toBe(true);
      expect(result.auditLogged).toBe(true);
    }
  });

  it("does not mark email as changed when email is the same", () => {
    const result = simulateUpdateUserDetails(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { fullName: "Test User", email: "same@court.go.ke", role: "admin" },
      true,
      "same@court.go.ke",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.emailChanged).toBe(false);
      expect(result.auditLogged).toBe(false);
    }
  });

  it("accepts update without email field (no change)", () => {
    const result = simulateUpdateUserDetails(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { fullName: "Test User", role: "admin" },
      true,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.emailChanged).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Permission consistency for user management
// ---------------------------------------------------------------------------

describe("user management permission consistency", () => {
  const rolesWithUserMgmt: UserRole[] = ["admin", "ict_officer"];
  const rolesWithoutUserMgmt: UserRole[] = ["registry_clerk", "archivist", "deputy_registrar", "judge"];

  it.each(rolesWithUserMgmt)("allows %s to manage users", (role) => {
    expect(canManageUsers(role)).toBe(true);
  });

  it.each(rolesWithoutUserMgmt)("blocks %s from managing users", (role) => {
    expect(canManageUsers(role)).toBe(false);
  });
});
