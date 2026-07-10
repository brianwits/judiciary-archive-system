import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx next dev -p 3000",
    port: 3000,
    timeout: 120_000,
    reuseExistingServer: true,
    cwd: process.cwd(),
  },
  projects: [{
    name: "chromium",
    use: {
      viewport: { width: 1280, height: 720 },
      launchOptions: {
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      },
    },
  }],
});
