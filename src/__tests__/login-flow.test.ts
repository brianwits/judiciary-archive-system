import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MOCK_USERS, DEMO_PASSWORD } from "@/data/seed/users";

// Mock next/headers before importing modules that use it
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("Mock login flow", () => {
  let mockCookieStore: {
    set: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockCookieStore = {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    };
    const { cookies } = await import("next/headers");
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue(mockCookieStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("demo users exist", () => {
    expect(MOCK_USERS.length).toBeGreaterThan(0);
  });

  it("demo password matches", () => {
    expect(DEMO_PASSWORD).toBe("demo1234");
  });

  it("first mock user has valid credentials for form pre-fill", () => {
    const first = MOCK_USERS[0];
    expect(first.email).toBeTruthy();
    expect(first.email).toContain("@");
  });

  it("all mock users have required fields", () => {
    for (const user of MOCK_USERS) {
      expect(user.id).toBeTruthy();
      expect(user.email).toBeTruthy();
      expect(user.fullName).toBeTruthy();
      expect(user.role).toBeTruthy();
      expect(user.email).toContain("@");
    }
  });

  it("mockSignIn with valid credentials sets session cookie and returns success", async () => {
    const { mockSignIn } = await import("@/lib/auth");
    const validEmail = "brian.mugendi@courts.go.ke";

    const result = await mockSignIn(validEmail, "demo1234");

    expect(result.error).toBeUndefined();
    // Should set mock_session_user_id cookie
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "mock_session_user_id",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }),
    );
  });

  it("mockSignIn with wrong password returns error", async () => {
    const { mockSignIn } = await import("@/lib/auth");
    const validEmail = "brian.mugendi@courts.go.ke";

    const result = await mockSignIn(validEmail, "wrongpassword");

    expect(result.error).toBe("Invalid email or password.");
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("mockSignIn with unknown email returns error", async () => {
    const { mockSignIn } = await import("@/lib/auth");

    const result = await mockSignIn("unknown@example.com", "demo1234");

    expect(result.error).toBe("Invalid email or password.");
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("all mock user emails are unique", () => {
    const emails = MOCK_USERS.map((u) => u.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(emails.length);
  });
});
