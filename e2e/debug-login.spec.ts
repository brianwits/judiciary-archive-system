import { test } from "@playwright/test";
test("login debug", async ({ page }) => {
  console.log("STEP 1: goto login");
  await page.goto("http://localhost:3000/login");
  await page.waitForTimeout(1000);
  console.log("STEP 2: fill fields");
  await page.locator("#email").fill("brian.mugendi@court.go.ke");
  await page.locator("#password").fill("demo1234");
  console.log("STEP 3: click submit");
  await page.getByRole("button", { name: /sign in/i }).click();
  console.log("STEP 4: waiting for redirect");
  const t0 = Date.now();
  try {
    await page.waitForURL(/^\/(?!login)/, { timeout: 120000 });
    console.log("STEP 5: Redirected in " + (Date.now()-t0) + "ms to " + page.url());
  } catch {
    console.log("STEP 5: FAILED after " + (Date.now()-t0) + "ms, URL=" + page.url());
    const text = await page.locator("body").textContent() || "";
    console.log("Body: " + text.slice(0, 400));
  }
});
