import { test, expect } from "@playwright/test";

const DEMO_PASSWORD = "demo1234";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect whether the app is running in mock/demo mode. */
async function isMockMode(page: import("@playwright/test").Page): Promise<boolean> {
  return await page.locator("#demo-user-select").isVisible({ timeout: 1000 }).catch(() => false);
}

/** Fill credentials and submit the login form. */
async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
  password: string = DEMO_PASSWORD,
) {
  await page.goto("/login");
  await page.waitForSelector("#email", { timeout: 15_000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

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
    // CardTitle renders as <div data-slot="card-title">, not a heading element
    await page.waitForSelector("#email", { timeout: 15_000 });
    await expect(page.locator('[data-slot="card-title"]', { hasText: "Sign in" })).toBeVisible();
  });

  test("shows demo mode description in mock mode", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 15_000 });
    const mock = await isMockMode(page);
    if (!mock) {
      test.skip();
      return;
    }
    await expect(
      page.getByText(/Demo mode.*select a user or enter credentials/),
    ).toBeVisible();
  });

  test("demo user dropdown is visible", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 15_000 });
    const mock = await isMockMode(page);
    if (!mock) {
      test.skip();
      return;
    }
    await page.waitForSelector("#demo-user-select", { timeout: 5_000 });
    await expect(page.locator("#demo-user-select")).toBeVisible();
  });

  test("email field is pre-filled with first mock user's email", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 15_000 });
    const mock = await isMockMode(page);
    if (mock) {
      await expect(page.locator("#email")).toHaveValue(
        "brian.mugendi@court.go.ke",
      );
    } else {
      // In production mode, email starts empty
      await expect(page.locator("#email")).toHaveValue("");
    }
  });

  test("password field is pre-filled with demo password", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForSelector("#password", { timeout: 15_000 });
    const mock = await isMockMode(page);
    if (mock) {
      await expect(page.locator("#password")).toHaveValue(DEMO_PASSWORD);
    } else {
      // In production mode, password starts empty
      await expect(page.locator("#password")).toHaveValue("");
    }
  });

  test("password field has type password (masked)", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#password", { timeout: 15_000 });
    await expect(page.locator("#password")).toHaveAttribute("type", "password");
  });

  test("sign in button is visible and enabled", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("button[type=submit]", { timeout: 15_000 });
    const button = page.getByRole("button", { name: "Sign in" });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// Demo User Dropdown
// ---------------------------------------------------------------------------

test.describe("Login Page – Demo User Selection", () => {
  test("demo user dropdown lists all 7 mock users", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 15_000 });
    const mock = await isMockMode(page);
    if (!mock) {
      test.skip();
      return;
    }
    await page.waitForSelector("#demo-user-select", { timeout: 5_000 });
    const options = page.locator("#demo-user-select option");
    // 1 placeholder + 8 users (inactive user added) = 9 options
    await expect(options).toHaveCount(9);
  });

  test("user can fill custom email after using dropdown selection", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 15_000 });
    const mock = await isMockMode(page);
    if (!mock) {
      test.skip();
      return;
    }
    await page.waitForSelector("#demo-user-select", { timeout: 5_000 });

    // First select from the dropdown (uses evaluate to work with React 19 event system)
    await page.evaluate(() => {
      const select = document.getElementById("demo-user-select") as HTMLSelectElement;
      if (select) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype, "value"
        )?.set;
        nativeInputValueSetter?.call(select, "user-registry");
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Fill a custom email to verify the field is editable
    await page.locator("#email").fill("custom@example.com");
    await expect(page.locator("#email")).toHaveValue("custom@example.com");
  });
});

// ---------------------------------------------------------------------------
// Setup — warm compilation so subsequent tests are fast
// ---------------------------------------------------------------------------

// Serial block: warmup runs first; if it fails, all form-submit tests are skipped
test.describe.serial("Login — warmup + form submissions", () => {
  // Warmup test — first login compiles the signIn server action and dashboard
  test("warmup — login once to compile dashboard", async ({ page }) => {
    test.setTimeout(360_000);
    await page.goto("/login");
    // Must fill credentials before clicking Sign In — in production mode fields
    // start empty (vs mock mode where they're pre-filled from the demo dropdown).
    await page.waitForSelector("#email", { timeout: 15_000 });
    await page.locator("#email").fill("brian.mugendi@court.go.ke");
    await page.locator("#password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    // Use waitForFunction to check URL change without waiting for page load compilation
    await page.waitForFunction(
      () => !window.location.pathname.includes("/login"),
      { timeout: 300_000 },
    );
  });

  test("valid login redirects to dashboard", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.waitForURL(/^\/(?!login)/, { timeout: 30_000 });
    await expect(page).toHaveURL(/^\/(?!login)/);
  });

  test("dashboard shows after login with admin user", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.waitForURL(/^\/(?!login)/, { timeout: 30_000 });
    await expect(
      page.getByText(/Dashboard|Welcome|Overview|KPI|Quick Actions/),
    ).toBeVisible();
  });

  test("login works with registry clerk user", async ({ page }) => {
    await loginAs(page, "peter.ochieng@court.go.ke");
    await page.waitForURL(/^\/(?!login)/, { timeout: 30_000 });
    await expect(page).toHaveURL(/^\/(?!login)/);
  });

  test("login works with archivist user", async ({ page }) => {
    await loginAs(page, "grace.akinyi@court.go.ke");
    await page.waitForURL(/^\/(?!login)/, { timeout: 30_000 });
    await expect(page).toHaveURL(/^\/(?!login)/);
  });

  test("button shows 'Signing in…' while submitting", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.waitForURL(/^\/(?!login)/, { timeout: 30_000 });
  });

  // --- Invalid credentials (also depend on compiled server action) ---

  test("wrong password shows error message", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke", "wrongpassword");
    await expect(page.getByText("Invalid email or password.")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("wrong email shows error message", async ({ page }) => {
    await loginAs(page, "nonexistent@example.com");
    await expect(page.getByText("Invalid email or password.")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("remains on login page after failed login", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke", "wrongpassword");
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/login/);
  });

  test("can retry login after failed attempt", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke", "wrongpassword");
    await expect(page.getByText("Invalid email or password.")).toBeVisible({
      timeout: 30_000,
    });

    await page.locator("#password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/^\/(?!login)/, { timeout: 30_000 });
    await expect(page).toHaveURL(/^\/(?!login)/);
  });

  // --- Post-login redirect (needs logged-in session from warmup) ---

  test("logged-in user can navigate to /cases", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.waitForURL(/^\/(?!login)/, { timeout: 30_000 });

    await page.goto("/cases");
    await expect(page).toHaveURL(/\/cases/);
    await expect(
      page.getByText(/Cases|Case Files|Case Management/),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("logged-in user can navigate to /users (admin)", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.waitForURL(/^\/(?!login)/, { timeout: 30_000 });

    await page.goto("/users");
    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByText("User Management")).toBeVisible({ timeout: 15_000 });
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



// NOTE: These E2E tests run against the mock data layer (NEXT_PUBLIC_USE_MOCK_DATA=true).
// The sign-in flow uses mockSignIn which sets a mock_session_user_id cookie.
// For Supabase mode tests, see scripts/test-supabase-login.mjs.
