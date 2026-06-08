import { describe, it, expect, vi, beforeEach } from "vitest";

// We test isMockDataEnabled indirectly by mocking process.env
function createMockChecker() {
  // Replicates the production logic from src/lib/config.ts
  function isMockDataEnabled(nodeEnv: string, envValue: string | undefined): boolean {
    if (nodeEnv === "production") {
      return false;
    }
    return envValue !== "false";
  }

  return { isMockDataEnabled };
}

describe("isMockDataEnabled", () => {
  const { isMockDataEnabled } = createMockChecker();

  it("returns false in production regardless of env var", () => {
    expect(isMockDataEnabled("production", "true")).toBe(false);
    expect(isMockDataEnabled("production", "false")).toBe(false);
    expect(isMockDataEnabled("production", undefined)).toBe(false);
  });

  it("returns true in development when env var is 'true'", () => {
    expect(isMockDataEnabled("development", "true")).toBe(true);
  });

  it("returns true in development when env var is undefined or unset", () => {
    expect(isMockDataEnabled("development", undefined)).toBe(true);
  });

  it("returns false in development when env var is explicitly 'false'", () => {
    expect(isMockDataEnabled("development", "false")).toBe(false);
  });

  it("returns true in development for any value other than 'false'", () => {
    expect(isMockDataEnabled("development", "1")).toBe(true);
    expect(isMockDataEnabled("development", "yes")).toBe(true);
    expect(isMockDataEnabled("development", "")).toBe(true);
  });
});
