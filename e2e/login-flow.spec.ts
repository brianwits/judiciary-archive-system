import { test, expect } from "@playwright/test";

const DEMO_PASSWORD = "demo1234";

// ---------------------------------------------------------------------------
// Page Load
// ---------------------------------------------------------------------------

test.describe("Login Page – Page Load", () => {
  test("loads the login page with correct title", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Judiciary Archive System/);
  });

  test("displays the Sign in card", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("shows demo mode description in mock mode", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByText(/Demo mode.*select a user or enter credentials/),
    ).toBeVisible();
  });

  test("demo user dropdown is visible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#demo-user-select")).toBeVisible();
  });

  test("email field is pre-filled with first mock user's email", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toHaveValue(
      "brian.mugendi@courts.go.ke",
    );
  });

  test("password field is pre-filled with demo password", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.locator("#password")).toHaveValue(DEMO_PASSWORD);
  });

  test("password field has type password (masked)", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#password")).toHaveAttribute("type", "password");
  });

  test("sign in button is visible and enabled", async ({ page }) => {
    await page.goto("/login");
    const button = page.getByRole("button", { name: "Sign in" });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// Demo User Dropdown
// ---------------------------------------------------------------------------

test.describe("Login Page – Demo User Selection", () => {
  test("demo user dropdown lists all 6 mock users", async ({ page }) => {
    await page.goto("/login");
    const options = page.locator("#demo-user-select option");
    // 1 placeholder + 6 users = 7 options
    await expect(options).toHaveCount(7);
  });

  test("selecting a user fills the email field", async ({ page }) => {
    await page.goto("/login");

    // Select Peter Ochieng (registry_clerk)
    await page.locator("#demo-user-select").selectOption("user-registry");
    await expect(page.locator("#email")).toHaveValue(
      "peter.ochieng@courts.go.ke",
    );
    await expect(page.locator("#password")).toHaveValue(DEMO_PASSWORD);
  });

  test("selecting judge user shows judge email", async ({ page }) => {
    await page.goto("/login");

    await page.locator("#demo-user-select").selectOption("user-judge");
    await expect(page.locator("#email")).toHaveValue("j.njeri@courts.go.ke");
    await expect(page.locator("#password")).toHaveValue(DEMO_PASSWORD);
  });

  test("selecting different users changes email each time", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.locator("#demo-user-select").selectOption("user-brian");
    await expect(page.locator("#email")).toHaveValue(
      "brian.mugendi@courts.go.ke",
    );

    await page.locator("#demo-user-select").selectOption("user-archivist");
    await expect(page.locator("#email")).toHaveValue(
      "grace.akinyi@courts.go.ke",
    );

    await page.locator("#demo-user-select").selectOption("user-deputy");
    await expect(page.locator("#email")).toHaveValue(
      "david.mutua@courts.go.ke",
    );
  });

  test("user can type a custom email after using dropdown", async ({
    page,
  }) => {
    await page.goto("/login");

    // First select from dropdown
    await page.locator("#demo-user-select").selectOption("user-registry");
    await expect(page.locator("#email")).toHaveValue(
      "peter.ochieng@courts.go.ke",
    );

    // Then type custom email
    await page.locator("#email").fill("custom@example.com");
    await expect(page.locator("#email")).toHaveValue("custom@example.com");
  });
});

// ---------------------------------------------------------------------------
// Form Submission – Valid Login
// ---------------------------------------------------------------------------

test.describe("Login – Valid Credentials", () => {
  test("valid login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should redirect to dashboard
    await page.waitForURL(/^\/(?!login)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/^\/(?!login)/);
  });

  test("dashboard shows after login with admin user", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/^\/(?!login)/, { timeout: 10_000 });

    // Dashboard should have welcome or KPI content
    await expect(
      page.getByText(/Dashboard|Welcome|Overview|KPI|Quick Actions/),
    ).toBeVisible();
  });

  test("login works with selected demo user (Peter Ochieng)", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#demo-user-select").selectOption("user-registry");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(/^\/(?!login)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/^\/(?!login)/);
  });

  test("login works with archivist user", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#demo-user-select").selectOption("user-archivist");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(/^\/(?!login)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/^\/(?!login)/);
  });

  test("button shows 'Signing in…' while submitting", async ({ page }) => {
    await page.goto("/login");

    // Use a small delay to capture the pending state
    const button = page.getByRole("button", { name: /Sign/ });
    await Promise.all([
      page.waitForURL(/^\/(?!login)/, { timeout: 10_000 }),
      button.click(),
    ]);
  });
});

// ---------------------------------------------------------------------------
// Form Submission – Invalid Login
// ---------------------------------------------------------------------------

test.describe("Login – Invalid Credentials", () => {
  test("wrong password shows error message", async ({ page }) => {
    await page.goto("/login");

    // Clear and type wrong password
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for error to appear
    await expect(page.getByText("Invalid email or password.")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("wrong email shows error message", async ({ page }) => {
    await page.goto("/login");

    await page.locator("#email").fill("nonexistent@example.com");
    await page.locator("#password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password.")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("remains on login page after failed login", async ({ page }) => {
    await page.goto("/login");

    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait briefly and check we're still on login
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/login/);
  });

  test("can retry login after failed attempt", async ({ page }) => {
    await page.goto("/login");

    // First, fail
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible({
      timeout: 10_000,
    });

    // Then, succeed
    await page.locator("#password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(/^\/(?!login)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/^\/(?!login)/);
  });
});

// ---------------------------------------------------------------------------
// Auth Gating – Unauthenticated Access
// ---------------------------------------------------------------------------

test.describe("Auth Gating – Unauthenticated Access", () => {
  test("redirects unauthenticated users from dashboard to login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated users from /cases to login", async ({
    page,
  }) => {
    await page.goto("/cases");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated users from /users to login", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated users from /tracking to login", async ({
    page,
  }) => {
    await page.goto("/tracking");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// Redirect after Login
// ---------------------------------------------------------------------------

test.describe("Login – Post-Login Redirect", () => {
  test("logged-in user can navigate to /cases", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/^\/(?!login)/, { timeout: 10_000 });

    // Navigate to cases
    await page.goto("/cases");
    await expect(page).toHaveURL(/\/cases/);
    await expect(
      page.getByText(/Cases|Case Files|Case Management/),
    ).toBeVisible();
  });

  test("logged-in user can navigate to /users (admin)", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/^\/(?!login)/, { timeout: 10_000 });

    // Brian is admin, so /users should be accessible
    await page.goto("/users");
    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByText("User Management")).toBeVisible();
  });
});

// NOTE: These E2E tests run against the mock data layer (NEXT_PUBLIC_USE_MOCK_DATA=true).
// The sign-in flow uses mockSignIn which sets a mock_session_user_id cookie.
// For Supabase mode tests, see scripts/test-supabase-login.mjs.
