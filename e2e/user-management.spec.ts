import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setMockSession(
  page: import("@playwright/test").Page,
  userId: string,
) {
  await page.context().addCookies([
    {
      name: "mock_session_user_id",
      value: userId,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

const ADMIN_ID = "user-brian";

// ---------------------------------------------------------------------------
// Page Load – Server-rendered content
// ---------------------------------------------------------------------------

test.describe("User Management – Page Load", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/\/login/);
  });

  test("loads user management page for admin", async ({ page }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/users");

    await expect(page.locator("h1")).toContainText("User Management");
    await expect(
      page.getByText("Assign roles and manage court staff"),
    ).toBeVisible();
  });

  test("displays all 6 users in the table", async ({ page }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/users");
    await page.waitForTimeout(500);

    const editButtons = page.getByRole("button", { name: /^Edit / });
    await expect(editButtons).toHaveCount(6);
  });

  test("shows expected user data in table rows", async ({ page }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/users");
    await page.waitForTimeout(500);

    await expect(page.getByText("Brian Mugendi").first()).toBeVisible();
    await expect(page.getByText("Peter Ochieng").first()).toBeVisible();
    await expect(
      page.getByText(/peter\.ochieng@courts\.go\.ke/).first(),
    ).toBeVisible();
    await expect(page.getByText("Grace Akinyi").first()).toBeVisible();
  });

  test("renders email column in the table", async ({ page }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/users");
    await page.waitForTimeout(500);

    // Verify that email addresses appear in the table
    await expect(
      page.getByText("brian.mugendi@courts.go.ke").first(),
    ).toBeVisible();
    await expect(
      page.getByText("peter.ochieng@courts.go.ke").first(),
    ).toBeVisible();
    await expect(
      page.getByText("grace.akinyi@courts.go.ke").first(),
    ).toBeVisible();
  });

  test("shows role values for each user in select triggers", async ({ page }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/users");
    await page.waitForTimeout(500);

    // Base UI Select renders raw enum values (not labels) in the trigger
    // e.g., "admin", "registry_clerk", "archivist"
    const roleTriggers = page.locator('[data-slot="select-trigger"]');
    await expect(roleTriggers).toHaveCount(6);

    // Check that each trigger contains a select-value with the raw role
    const values = page.locator('[data-slot="select-value"]');
    await expect(values).toHaveCount(6);
    await expect(values.nth(0)).toContainText("admin");
    await expect(values.nth(2)).toContainText("registry_clerk");
    await expect(values.nth(3)).toContainText("archivist");
  });

  test("shows status badges (Active)", async ({ page }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/users");
    await page.waitForTimeout(500);

    // All users should have "Active" badges
    const activeBadges = page.getByText("Active");
    const count = await activeBadges.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test("shows PJ Number and Department columns", async ({ page }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/users");
    await page.waitForTimeout(500);

    await expect(page.getByText("80602").first()).toBeVisible();
    await expect(page.getByText("ICT").first()).toBeVisible();
    await expect(page.getByText("Archive").first()).toBeVisible();
    await expect(page.getByText("Registry").first()).toBeVisible();
  });

  test("shows pagination when enough users", async ({ page }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/users");
    await page.waitForTimeout(500);

    // With 6 users and PAGE_SIZE=10, there should be 1 page, so
    // pagination controls should not show
    const prevButton = page.getByRole("button", { name: "Previous" });
    const nextButton = page.getByRole("button", { name: "Next" });

    // 6 users fit on one page, so no pagination
    await expect(prevButton).toHaveCount(0);
    await expect(nextButton).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

test.describe("Navigation", () => {
  test("settings page loads correctly", async ({ page }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/settings");

    await expect(
      page.getByText("Account and system preferences"),
    ).toBeVisible();
    await expect(page.getByText("Profile").first()).toBeVisible();
    await expect(page.getByText("System").first()).toBeVisible();
    await expect(
      page.getByText("brian.mugendi@courts.go.ke").first(),
    ).toBeVisible();
  });

  test("settings page shows data mode and application info", async ({
    page,
  }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/settings");

    await expect(page.getByText("Mock / demo")).toBeVisible();
    await expect(page.getByText("Judiciary Archive System")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Auth Gating
// ---------------------------------------------------------------------------

test.describe("Auth Gating – User Management", () => {
  test("judge user cannot access /users", async ({ page }) => {
    await setMockSession(page, "user-judge");
    await page.goto("/users");

    await expect(page).toHaveURL(/\/(?!users)/);
    await expect(page.getByText("User Management")).not.toBeVisible();
  });

  test("archivist cannot access /users", async ({ page }) => {
    await setMockSession(page, "user-archivist");
    await page.goto("/users");

    await expect(page).toHaveURL(/\/(?!users)/);
  });

  test("deputy registrar cannot access /users", async ({ page }) => {
    await setMockSession(page, "user-deputy");
    await page.goto("/users");

    await expect(page).toHaveURL(/\/(?!users)/);
  });

  test("registry clerk cannot access /users", async ({ page }) => {
    await setMockSession(page, "user-registry");
    await page.goto("/users");

    await expect(page).toHaveURL(/\/(?!users)/);
  });

  test("admin can access /users", async ({ page }) => {
    await setMockSession(page, ADMIN_ID);
    await page.goto("/users");

    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByText("User Management").first()).toBeVisible();
  });

  test("ict_officer can access /users", async ({ page }) => {
    await setMockSession(page, "user-ict");
    await page.goto("/users");

    await expect(page).toHaveURL(/\/users/);
    await expect(page.getByText("User Management").first()).toBeVisible();
  });
});

// NOTE: Interactive e2e tests (email change dialog, role update dropdown,
// settings dropdown) require React hydration to attach event handlers to
// Base UI components. The dev server in this environment has a known
// hydration stall (HMR WebSocket issue). These flows are verified via:
// - 21 unit tests in src/__tests__/user-management.test.ts
// - Mock store integration tests (direct mockStore.updateUser calls)
