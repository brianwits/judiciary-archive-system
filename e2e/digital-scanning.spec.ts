import { expect, test } from "@playwright/test";

test("authorized staff can open the digital scanning workflow", async ({ context, page }) => {
  await context.addCookies([{
    name: "mock_session_user_id",
    value: "user-brian",
    url: "http://127.0.0.1:3000",
    httpOnly: true,
    sameSite: "Lax",
  }]);

  await page.goto("/scanning");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Digital Scanning" })).toBeVisible();

  await page.locator("#scan-code").fill("HCCR/123/2025");
  await page.getByRole("button", { name: "Find case" }).click();

  await expect(page.getByText("HCCR/123/2025", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Capture with camera" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select scanned files" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Digitize documents/ })).toBeDisabled();
});
