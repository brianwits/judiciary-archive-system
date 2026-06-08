/**
 * Diagnostic: Identifies which route produces < 50 chars of content
 */
import { test, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const VALID_PASSWORD = "demo1234";

async function login(page: Page, email: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const select = page.locator("#demo-user-select");
  if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
    const options = await select.locator("option").all();
    for (const opt of options) {
      const value = await opt.getAttribute("value");
      if (!value) continue;
      const text = await opt.textContent();
      if (text?.includes(email)) {
        await select.selectOption(value);
        await page.waitForTimeout(800);
        break;
      }
    }
  }

  const emailInput = page.locator("#email");
  if (await emailInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await emailInput.fill(email);
  }

  const pwInput = page.locator("#password");
  if (await pwInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await pwInput.fill(VALID_PASSWORD);
  }

  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForTimeout(2000);
}

test("Pinpoint which route loads poorly", async ({ page }) => {
  await login(page, "brian.mugendi@courts.go.ke");

  const routes = ["/", "/cases", "/tracking", "/registry", "/archive", "/audit", "/reports", "/settings", "/users"];

  for (const r of routes) {
    await page.goto(`${BASE_URL}${r}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const body = await page.locator("body").textContent() || "";
    const url = page.url();
    const length = body.length;
    const has404 = body.includes("404") || body.includes("Not Found");
    const hasLoading = body.includes("Loading") || body.includes("Skeleton");

    console.log(`Route ${r}: length=${length}, url=${url}, has404=${has404}, hasLoading=${hasLoading}`);
    console.log(`  Preview: "${body.substring(0, 120)}..."`);
  }
});
