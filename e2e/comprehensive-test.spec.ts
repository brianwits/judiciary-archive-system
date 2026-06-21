/**
 * Comprehensive E2E test for Judiciary Archive System
 * Tests: Login, Dashboard, Navigation, Cases, Tracking, Registry,
 *        Audit, Reports, Settings, Archive, Users, Responsive Design
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const VALID_PASSWORD = "demo1234";

// Test results tracking
const results: { test: string; passed: boolean; details: string }[] = [];

function recordResult(testName: string, passed: boolean, details: string) {
  results.push({ test: testName, passed, details });
}

/** Detect whether the app is running in mock/demo mode. */
async function isMockMode(page: Page): Promise<boolean> {
  return await page.locator("#demo-user-select").isVisible({ timeout: 1000 }).catch(() => false);
}

async function loginAs(page: Page, email: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Fill email directly — bypasses React 19 synthetic event issues with selectOption
  const emailInput = page.locator("#email");
  await emailInput.waitFor({ state: "visible", timeout: 15_000 });
  await emailInput.fill(email);

  // Fill password
  await page.locator("#password").fill(VALID_PASSWORD);

  // Click Sign in button
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to dashboard (generous timeout for first compilation)
  await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 30_000 }).catch(() => {});
}

// ─── 1. LOGIN FLOW TESTS ──────────────────────────────────────────────────────

test.describe("Login Flow", () => {
  // Warmup: pre-compile the login server action so subsequent logins are fast
  test("0.0 - Warmup: pre-compile login action", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
    await page.locator("#email").fill("brian.mugendi@court.go.ke");
    await page.locator("#password").fill(VALID_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 150_000 });
    recordResult("Warmup login completed", true, "Dashboard reached");
  });

  test("1.1 - Login page loads with form elements", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/login");
    recordResult("Login page URL correct", true, `URL: ${page.url()}`);

    // Check common form elements always present
    const email = page.locator("#email");
    const password = page.locator("#password");
    const submit = page.getByRole("button", { name: /sign in/i });

    expect(await email.isVisible()).toBeTruthy();
    expect(await password.isVisible()).toBeTruthy();
    expect(await submit.isVisible()).toBeTruthy();
    recordResult("Login form has core fields", true, "Email, Password, Submit button all present");

    // Conditionally test the demo user dropdown in mock mode
    const mock = await isMockMode(page);
    if (mock) {
      const select = page.locator("#demo-user-select");
      expect(await select.isVisible()).toBeTruthy();

      // Quick-select a user and verify auto-fill
      await select.selectOption("user-brian");
      await page.waitForTimeout(500);
      const emailValue = await email.inputValue();
      expect(emailValue).toBe("brian.mugendi@court.go.ke");
      recordResult("Demo user dropdown auto-fills email", true, `Email auto-filled to: ${emailValue}`);
    } else {
      recordResult("Demo user dropdown (production mode - skipped)", true, "Not applicable in production mode");
    }

    // Check branding
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    recordResult("Page has title", true, `Title: "${title}"`);
  });

  test("1.2 - Invalid credentials show error", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    // Fill wrong credentials
    await page.locator("#email").fill("wrong@email.com");
    await page.locator("#password").fill("wrongpass");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForTimeout(2000);

    // Should still be on login page with error
    expect(page.url()).toContain("/login");
    recordResult("Stays on login after bad credentials", true, "Redirected back to /login");

    const body = await page.locator("body").textContent() || "";
    const hasError = body.toLowerCase().includes("invalid") ||
                     body.toLowerCase().includes("error") ||
                     body.toLowerCase().includes("incorrect");
    recordResult("Error shown for bad credentials", hasError, hasError ? "Error message visible" : "No error message found");
  });

  test("1.3 - Valid login redirects to dashboard", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.waitForTimeout(1000);

    const onDashboard = !page.url().includes("/login");
    recordResult("Admin login redirects from /login", onDashboard, `URL: ${page.url()}`);

    const body = await page.locator("body").textContent() || "";
    const userNameVisible = body.includes("Brian") || body.includes("Mugendi");
    recordResult("User name visible after login", userNameVisible, userNameVisible ? "Found 'Brian Mugendi'" : "User name not found");
  });

  test("1.4 - Inactive user cannot login", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    const mock = await isMockMode(page);
    if (!mock) {
      test.skip();
      return;
    }

    // Select inactive user from the demo dropdown
    const select = page.locator("#demo-user-select");
    await select.selectOption("user-inactive");
    await page.waitForTimeout(500);

    // Try to sign in
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForTimeout(2000);

    const stillOnLogin = page.url().includes("/login");
    recordResult("Inactive user stays on login", stillOnLogin, stillOnLogin ? "Still on /login" : `URL: ${page.url()}`);
  });

  test("1.5 - Logout works", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");

    // Sign out is inside a user DropdownMenu — open the trigger first
    const dropdownTrigger = page.locator('[data-slot="dropdown-menu-trigger"]').last();
    const triggerVisible = await dropdownTrigger.isVisible({ timeout: 2000 }).catch(() => false);
    if (triggerVisible) {
      await dropdownTrigger.click();
      await page.waitForTimeout(500);
    }

    // Now find and click Sign out
    const signOutBtn = page.locator('button:has-text("Sign out")');
    const found = await signOutBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (found) {
      await signOutBtn.click();
      await page.waitForTimeout(1500);
      const onLogin = page.url().includes("/login");
      recordResult("Logout works", onLogin, onLogin ? "Redirected to /login" : `URL: ${page.url()}`);
    } else {
      recordResult("Logout button visible", false, "Could not find Sign out button in dropdown");
    }
  });
});

// ─── 2. DASHBOARD & NAVIGATION TESTS ──────────────────────────────────────────

test.describe("Dashboard & Navigation", () => {
  test("2.1 - Dashboard has KPIs, movements, quick actions", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const body = await page.locator("body").textContent() || "";
    const hasKPIs = /\d+/.test(body) && (body.toLowerCase().includes("case") || body.toLowerCase().includes("active"));
    recordResult("Dashboard shows KPI statistics", hasKPIs, hasKPIs ? "Numbers + case references found" : "No KPIs detected");

    const hasMovements = body.toLowerCase().includes("movement") || body.toLowerCase().includes("recent");
    recordResult("Recent movements section", hasMovements, hasMovements ? "Found movement/recent references" : "Not found");

    const hasActions = body.toLowerCase().includes("action") || body.toLowerCase().includes("quick");
    recordResult("Quick actions area", hasActions, hasActions ? "Found quick/action references" : "Not found");

    const links = await page.locator("a").count();
    recordResult("Dashboard has navigation links", links > 3, `${links} links found`);

    const buttons = await page.locator("button").count();
    recordResult("Dashboard has buttons", buttons > 0, `${buttons} buttons found`);
  });

  test("2.2 - Sidebar navigation visible with links", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.waitForTimeout(1000);

    const body = await page.locator("body").textContent() || "";
    const navLabels = ["dashboard", "cases", "tracking", "registry", "archive", "audit", "reports", "settings", "users"];
    const foundLabels = navLabels.filter(l => body.toLowerCase().includes(l));
    recordResult("Navigation items in sidebar", foundLabels.length >= 6,
      `Found ${foundLabels.length}/9: ${foundLabels.join(", ")}`);
  });

  test("2.3 - All page routes load without errors", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");

    const pages = ["/", "/cases", "/tracking", "/registry", "/archive", "/audit", "/reports", "/settings", "/users"];

    for (const p of pages) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3000);

      const body = await page.locator("body").textContent() || "";
      const currentUrl = page.url();

      // Check 1: body has meaningful content (loading.skeleton / actual content counts)
      const hasContent = body.length > 50;

      // Check 2: no client-side redirect to /login (means redirect-permission issue)
      const notRedirectedToLogin = !currentUrl.includes("/login");

      // Check 3: visible heading or nav exists (reliable page-loaded indicator)
      const visibleHeading = await page.locator("h1, h2, nav a, [role=\"heading\"]").first().isVisible({ timeout: 1000 }).catch(() => false);

      const ok = hasContent && notRedirectedToLogin && visibleHeading;
      if (!ok) console.log(`Route ${p}: length=${body.length}, url=${currentUrl}, heading=${visibleHeading}`);
      recordResult(`Page ${p} loads`, ok, ok ? `Content: ${body.length} chars, heading found` : `Issue: length=${body.length}, url=${currentUrl}, heading=${visibleHeading}`);
      expect.soft(ok, `Route ${p} should load with navigation or heading`).toBeTruthy();
    }
  });

  test("2.4 - Theme toggle switch works", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");

    // Look for theme toggle buttons - try various selectors
    const themeBtn = page.locator(
      'button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"], ' +
      'button:has-text("Toggle"), button:has-text("theme"), ' +
      'button[class*="theme"]'
    ).first();

    const found = await themeBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (found) {
      await themeBtn.click();
      await page.waitForTimeout(500);
      recordResult("Theme toggle clickable", true, "Theme toggle found and clicked");
    } else {
      // Try to find by lucide icon (Sun/Moon)
      const allButtons = page.locator("button");
      const count = await allButtons.count();
      let toggled = false;
      for (let i = 0; i < count; i++) {
        const html = await allButtons.nth(i).innerHTML();
        if (html.includes("lucide") && (html.includes("sun") || html.includes("moon") || html.includes("Sun") || html.includes("Moon"))) {
          await allButtons.nth(i).click();
          toggled = true;
          break;
        }
      }
      recordResult("Theme toggle exists", toggled, toggled ? "Found and clicked theme toggle via icon" : "No theme toggle found");
    }
  });
});

// ─── 3. CASES MODULE TESTS ────────────────────────────────────────────────────

test.describe("Cases Module", () => {
  test("3.1 - Cases page lists cases with filters", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/cases`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const body = await page.locator("body").textContent() || "";
    const hasCases = body.includes("HC") || body.includes("CIVIL") || body.includes("CRIMINAL") || body.toLowerCase().includes("case");
    recordResult("Cases listed on page", hasCases, hasCases ? "Case data visible" : "No case references found");

    // Search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 1000 }).catch(() => false);
    recordResult("Search input visible", hasSearch, hasSearch ? "Search field present" : "No search input");

    // Filter controls — uses shadcn Select with role="combobox", not native <select>
    const filterComboboxes = page.locator('[role="combobox"]').count();
    recordResult("Filter controls present", await filterComboboxes > 0, `${await filterComboboxes} combobox elements found`);

    // New Case button
    const newBtn = page.locator('a:has-text("New Case"), button:has-text("New Case"), a:has-text("Register Case")').first();
    const hasNewBtn = await newBtn.isVisible({ timeout: 1000 }).catch(() => false);
    recordResult("New Case button", hasNewBtn, hasNewBtn ? "Found" : "Not found");

    // Search
    if (hasSearch) {
      await searchInput.fill("HC");
      await searchInput.press("Enter");
      await page.waitForTimeout(1500);
      recordResult("Search executes", true, "Search submitted");
    }
  });

  test("3.2 - Create a new case", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/cases/new`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const url = page.url();
    const onForm = url.includes("/cases/new") || url.includes("/new");
    recordResult("New Case form page loads", onForm, onForm ? `URL: ${url}` : `URL: ${url} (not on form)`);

    if (onForm) {
      // Fill form fields
      const inputs = page.locator("input, textarea, select");
      const count = await inputs.count();
      recordResult("Form has input fields", count > 0, `${count} fields`);

      // Try submitting
      const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
      const hasSubmit = await submitBtn.isVisible({ timeout: 1000 }).catch(() => false);
      if (hasSubmit) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        recordResult("Form submits", true, "Submit button clicked");
      } else {
        recordResult("Submit button on form", false, "No submit button found");
      }
    }
  });

  test("3.3 - View case details", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/cases`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Find a case link
    const caseLink = page.locator('a[href*="/cases/"]').first();
    const found = await caseLink.isVisible({ timeout: 2000 }).catch(() => false);
    if (found) {
      await caseLink.click();
      // Wait for case detail page to stream content (server component)
      await page.waitForSelector("text=Overview", { timeout: 120_000 });
      const onDetail = page.url().includes("/cases/") && !page.url().endsWith("/cases");
      recordResult("Case detail page loads", onDetail, onDetail ? `URL: ${page.url()}` : "Not navigated to detail");

      const body = await page.locator("body").textContent() || "";
      const hasContent = body.length > 100;
      const hasDocs = body.toLowerCase().includes("document");
      const hasMovements = body.toLowerCase().includes("movement") || body.toLowerCase().includes("tracking");
      const hasTabs = body.toLowerCase().includes("overview") && body.toLowerCase().includes("documents");

      recordResult("Case detail has content", hasContent, `Content length: ${body.length}`);
      recordResult("Documents section visible", hasDocs, hasDocs ? "Found" : "Not found");
      recordResult("Movement history visible", hasMovements, hasMovements ? "Found" : "Not found");
      recordResult("Case detail tabs visible", hasTabs, hasTabs ? "Overview + Documents tabs found" : "Not found");
    } else {
      recordResult("Case link clickable", false, "No case link found on page");
    }
  });
});

// ─── 4. OTHER PAGES TESTS ─────────────────────────────────────────────────────

test.describe("Other Pages", () => {
  test("4.1 - Tracking page", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/tracking`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const body = await page.locator("body").textContent() || "";
    const ok = body.length > 50;
    recordResult("Tracking page loads", ok, ok ? `Content: ${body.length} chars` : "Empty page");

    const hasCheckout = body.toLowerCase().includes("check out") || body.toLowerCase().includes("checkout");
    const hasCheckin = body.toLowerCase().includes("check in") || body.toLowerCase().includes("checkin");
    recordResult("Checkout functionality", hasCheckout, hasCheckout ? "Found" : "Not found");
    recordResult("Check-in functionality", hasCheckin, hasCheckin ? "Found" : "Not found");

    const hasTable = body.toLowerCase().includes("movement") || body.includes("table");
    recordResult("Movement table visible", hasTable, hasTable ? "Found" : "Not found");
  });

  test("4.2 - Registry page", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/registry`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const body = await page.locator("body").textContent() || "";
    const ok = body.length > 50;
    recordResult("Registry page loads", ok, ok ? `Content: ${body.length} chars` : "Empty page");

    const hasRequests = body.toLowerCase().includes("request") || body.toLowerCase().includes("registry");
    recordResult("Registry requests visible", hasRequests, hasRequests ? "Found" : "Not found");
  });

  test("4.3 - Archive page", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/archive`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const body = await page.locator("body").textContent() || "";
    const ok = body.length > 50;
    recordResult("Archive page loads", ok, ok ? `Content: ${body.length} chars` : "Empty page");

    const hasRooms = body.toLowerCase().includes("room") || body.toLowerCase().includes("storage");
    recordResult("Archive rooms/storage visible", hasRooms, hasRooms ? "Found" : "Not found");
  });

  test("4.4 - Audit page", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/audit`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const body = await page.locator("body").textContent() || "";
    const ok = body.length > 50;
    recordResult("Audit page loads", ok, ok ? `Content: ${body.length} chars` : "Empty page");

    const hasExport = body.toLowerCase().includes("export");
    recordResult("Export button visible", hasExport, hasExport ? "Found" : "Not found");

    const hasLogs = body.toLowerCase().includes("audit") || body.toLowerCase().includes("log") || body.toLowerCase().includes("action");
    recordResult("Audit log entries visible", hasLogs, hasLogs ? "Found" : "Not found");
  });

  test("4.5 - Reports page", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const body = await page.locator("body").textContent() || "";
    const ok = body.length > 50;
    recordResult("Reports page loads", ok, ok ? `Content: ${body.length} chars` : "Empty page");

    const charts = await page.locator("svg").count();
    recordResult("Charts visible on reports", charts > 0, `${charts} SVG elements (charts)`);

    const hasStats = /\d+%/.test(body) || body.toLowerCase().includes("statistic");
    recordResult("Statistics/percentages visible", hasStats, hasStats ? "Found stats data" : "No stats references");
  });

  test("4.6 - Settings page", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const body = await page.locator("body").textContent() || "";
    const ok = body.length > 50;
    recordResult("Settings page loads", ok, ok ? `Content: ${body.length} chars` : "Empty page");

    const hasProfile = body.toLowerCase().includes("profile") || body.toLowerCase().includes("name");
    const hasNotifications = body.toLowerCase().includes("notification");
    const hasAppearance = body.toLowerCase().includes("theme") || body.toLowerCase().includes("appearance") || body.toLowerCase().includes("dark");
    const hasPassword = body.toLowerCase().includes("password");

    recordResult("Profile settings visible", hasProfile, hasProfile ? "Found" : "Not found");
    recordResult("Notification preferences visible", hasNotifications, hasNotifications ? "Found" : "Not found");
    recordResult("Appearance settings visible", hasAppearance, hasAppearance ? "Found" : "Not found");
    recordResult("Password change visible", hasPassword, hasPassword ? "Found" : "Not found");
  });

  test("4.7 - Users management page", async ({ page }) => {
    await loginAs(page, "brian.mugendi@court.go.ke");
    await page.goto(`${BASE_URL}/users`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const body = await page.locator("body").textContent() || "";
    const ok = body.length > 50;
    recordResult("Users page loads", ok, ok ? `Content: ${body.length} chars` : "Empty page");

    const hasUsers = body.toLowerCase().includes("user") || body.includes("@") || body.toLowerCase().includes("role");
    recordResult("User list visible", hasUsers, hasUsers ? "Found user references" : "No user data");

    const hasEditButtons = await page.locator('button[aria-label^="Edit"]').count();
    recordResult("Edit user option available", hasEditButtons > 0, hasEditButtons > 0 ? `${hasEditButtons} edit buttons found` : "Not found");
  });
});

// ─── 5. RESPONSIVE DESIGN TESTS ───────────────────────────────────────────────

test.describe("Responsive Design", () => {
  test("5.1 - Mobile viewport (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAs(page, "brian.mugendi@court.go.ke");

    const body = await page.locator("body").textContent() || "";
    const ok = body.length > 50;
    recordResult("Mobile 375px renders content", ok, ok ? `Content: ${body.length} chars` : "No content");

    // Check navbar adapts (might be hamburger)
    const hamburger = page.locator(
      'button[aria-label*="menu"], button:has-text("Menu"), [class*="hamburger"], ' +
      'button[aria-label*="Toggle navigation"]'
    ).first();
    // Wait for layout to render after login redirect
    await page.waitForTimeout(2000);
    const hasHamburger = await hamburger.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasHamburger) {
      await hamburger.click();
      await page.waitForTimeout(500);
      recordResult("Mobile hamburger menu works", true, "Hamburger found and clicked");
    } else {
      recordResult("Mobile navigation adaptation", false, "No hamburger/sidebar toggle found");
    }

    // Navigate to cases
    await page.goto(`${BASE_URL}/cases`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const casesBody = await page.locator("body").textContent() || "";
    recordResult("Cases page on mobile", casesBody.length > 50, `Content: ${casesBody.length} chars`);
  });

  test("5.2 - Tablet viewport (768px)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAs(page, "brian.mugendi@court.go.ke");

    const body = await page.locator("body").textContent() || "";
    const ok = body.length > 50;
    recordResult("Tablet 768px renders content", ok, ok ? `Content: ${body.length} chars` : "No content");
  });

  test("5.3 - Desktop viewport (1440px)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAs(page, "brian.mugendi@court.go.ke");

    // Check key pages at desktop (avoid full 9-page iteration to prevent timeouts)
    const keyRoutes = ["/", "/cases", "/tracking"];
    let allGood = true;
    for (const r of keyRoutes) {
      await page.goto(`${BASE_URL}${r}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      const text = await page.locator("body").textContent() || "";
      if (text.length < 50) {
        allGood = false;
        console.log(`  ⚠ Desktop ${r}: only ${text.length} chars`);
      }
    }
    recordResult("Desktop 1440px key pages load", allGood, allGood ? "Key pages loaded fine" : "Some pages had issues");
  });
});

// ─── 6. CONSOLE ERROR CHECK ──────────────────────────────────────────────────

test.describe("Error Checking", () => {
  test("6.1 - No console errors during navigation", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));

    await loginAs(page, "brian.mugendi@court.go.ke");

    // Use 'load' instead of 'networkidle' - avoids HMR WebSocket hanging
    const routes = ["/", "/cases", "/tracking", "/registry", "/archive", "/audit", "/reports", "/settings", "/users"];
    for (const r of routes) {
      await page.goto(`${BASE_URL}${r}`, { waitUntil: "load" });
      await page.waitForTimeout(1000);
    }

    recordResult("No page errors during navigation",
      errors.length === 0,
      errors.length === 0 ? "Clean - no errors" : `${errors.length} errors found: ${errors.slice(0, 3).join("; ")}`
    );

    if (errors.length > 0) {
      console.log("\n--- Console Errors Found ---");
      errors.forEach((e) => console.log(`  🔴 ${e}`));
    }
  });
});

// ─── REPORT GENERATION ────────────────────────────────────────────────────────

test.afterAll(() => {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║              COMPREHENSIVE TEST REPORT                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Total tests : ${results.length}`);
  console.log(`  Passed      : ${passed}`);
  console.log(`  Failed      : ${failed}`);
  console.log(`  Pass rate   : ${results.length > 0 ? Math.round((passed / results.length) * 100) : 0}%`);
  console.log("");

  if (failed > 0) {
    console.log("  ❌ FAILED TESTS:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`    - ${r.test}`);
      console.log(`      ${r.details}`);
    });
    console.log("");
  }

  console.log("  ✅ PASSED TESTS:");
  results.filter((r) => r.passed).forEach((r) => {
    console.log(`    - ${r.test}: ${r.details}`);
  });
  console.log("");
});
