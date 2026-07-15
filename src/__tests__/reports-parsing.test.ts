import { describe, it, expect } from "vitest";
import { parseReportJson } from "@/lib/data/supabase-queries";
import { REPORT_DATA } from "@/data/seed/dashboard";

// ─── Helpers ────────────────────────────────────────────────────────────────

function asJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ─── caseTypeStats parsing ──────────────────────────────────────────────────

describe("parseReportJson — caseTypeStats", () => {
  it("parses canonical case types with numeric caseTypeId", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    const mcCriminal = result.caseTypeStats.find(
      (t) => t.caseTypeId === 33 && t.code === "MCCR",
    );
    expect(mcCriminal).toBeDefined();
    expect(mcCriminal?.fullLabel).toContain("MCCR");
    expect(mcCriminal?.courtLevel).toBe("Magistrate Court");
    expect(mcCriminal?.value).toBeGreaterThan(0);
  });

  it("handles null caseTypeId for legacy/unclassified types", () => {
    const raw = asJson(REPORT_DATA);
    // Add a legacy entry to the raw data
    raw.caseTypeStats.push({
      caseTypeId: null,
      code: "LEGACY",
      name: "Legacy Type",
      fullLabel: "LEGACY - Legacy Type",
      courtLevel: "Magistrate Court",
      value: 4,
    });
    const result = parseReportJson(raw);
    const legacy = result.caseTypeStats.find(
      (t) => t.caseTypeId === null && t.code === "LEGACY",
    );
    expect(legacy).toBeDefined();
    expect(legacy?.courtLevel).toBe("Magistrate Court");
    expect(legacy?.value).toBe(4);
  });

  it("preserves all required fields in parsed output", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    for (const item of result.caseTypeStats) {
      expect(item).toHaveProperty("caseTypeId");
      expect(item).toHaveProperty("code");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("fullLabel");
      expect(item).toHaveProperty("courtLevel");
      expect(item).toHaveProperty("value");
    }
  });

  it("handles missing caseTypeStats gracefully (empty array)", () => {
    const raw = asJson(REPORT_DATA);
    delete (raw as Partial<typeof raw>).caseTypeStats;
    const result = parseReportJson(raw);
    expect(result.caseTypeStats).toEqual([]);
  });
});

// ─── caseCategoryStats parsing ──────────────────────────────────────────────

describe("parseReportJson — caseCategoryStats", () => {
  it("parses category stats with all required fields", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    for (const item of result.caseCategoryStats) {
      expect(item).toHaveProperty("categoryCode");
      expect(item).toHaveProperty("categoryName");
      expect(item).toHaveProperty("courtLevel");
      expect(item).toHaveProperty("value");
      expect(typeof item.value).toBe("number");
    }
  });

  it("includes categories from Magistrate Court (the only level in source data)", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    const mcCategories = result.caseCategoryStats.filter(
      (c) => c.courtLevel === "Magistrate Court",
    );
    expect(mcCategories.length).toBeGreaterThan(0);
  });

  it("handles missing caseCategoryStats gracefully (empty array)", () => {
    const raw = asJson(REPORT_DATA);
    delete (raw as Partial<typeof raw>).caseCategoryStats;
    const result = parseReportJson(raw);
    expect(result.caseCategoryStats).toEqual([]);
  });

  it("preserves category values as numbers", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    for (const item of result.caseCategoryStats) {
      expect(Number.isFinite(item.value)).toBe(true);
    }
  });
});

// ─── REPORT_DATA seed validation ────────────────────────────────────────────

describe("REPORT_DATA seed — Kabarnet data validation", () => {
  it("includes Magistrate Court in courtLevelStats", () => {
    const mcLevel = REPORT_DATA.courtLevelStats.find(
      (c) => c.name === "Magistrate Court",
    );
    expect(mcLevel).toBeDefined();
    expect(mcLevel!.value).toBeGreaterThan(0);
  });

  it("has canonical type IDs (non-null) for known types", () => {
    const canonicalTypes = REPORT_DATA.caseTypeStats.filter(
      (t) => t.caseTypeId !== null,
    );
    expect(canonicalTypes.length).toBeGreaterThan(0);
    for (const t of canonicalTypes) {
      expect(typeof t.caseTypeId).toBe("number");
    }
  });

  it("totalCases matches approximate sum of court level counts", () => {
    const sumOfLevels = REPORT_DATA.courtLevelStats.reduce(
      (sum, c) => sum + c.value,
      0,
    );
    expect(REPORT_DATA.totalCases).toBeGreaterThanOrEqual(sumOfLevels);
  });

  it("unclassifiedCount is tracked", () => {
    expect(typeof REPORT_DATA.unclassifiedCount).toBe("number");
  });
});

// ─── Seed data round-trip via parseReportJson ───────────────────────────────

describe("REPORT_DATA — parse round-trip", () => {
  it("caseTypeStats round-trips through parseReportJson correctly", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    expect(result.caseTypeStats.length).toBe(REPORT_DATA.caseTypeStats.length);
    for (const original of REPORT_DATA.caseTypeStats) {
      const parsed = result.caseTypeStats.find(
        (p) =>
          p.code === original.code &&
          p.caseTypeId === original.caseTypeId &&
          p.name === original.name,
      );
      expect(parsed).toBeDefined();
      expect(parsed!.value).toBe(original.value);
    }
  });

  it("courtLevelStats round-trips correctly", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    expect(result.courtLevelStats).toEqual(REPORT_DATA.courtLevelStats);
  });

  it("totalCases and unclassifiedCount round-trip correctly", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    expect(result.totalCases).toBe(REPORT_DATA.totalCases);
    expect(result.unclassifiedCount).toBe(REPORT_DATA.unclassifiedCount);
  });
});

// ─── Edge cases and error handling ──────────────────────────────────────────

describe("parseReportJson — edge cases", () => {
  it("handles null input fields gracefully", () => {
    const result = parseReportJson({
      someIrrelevantField: "test",
    } as Parameters<typeof parseReportJson>[0]);
    expect(result.caseTypeStats).toEqual([]);
    expect(result.caseCategoryStats).toEqual([]);
    expect(result.courtLevelStats).toEqual([]);
    expect(result.totalCases).toBe(0);
    expect(result.unclassifiedCount).toBe(0);
  });

  it("handles malformed caseTypeStats entries without crashing", () => {
    const raw = asJson(REPORT_DATA);
    raw.caseTypeStats = [
      { caseTypeId: null }, // missing code, name, etc.
    ] as typeof raw.caseTypeStats;
    const result = parseReportJson(raw);
    expect(result.caseTypeStats).toHaveLength(1);
    expect(result.caseTypeStats[0].code).toBe("");
    expect(result.caseTypeStats[0].value).toBe(0);
  });

  it("converts string values to numbers in caseTypeStats", () => {
    const raw = asJson(REPORT_DATA);
    (raw.caseTypeStats[0] as { value: unknown }).value = "42";
    const result = parseReportJson(raw);
    expect(typeof result.caseTypeStats[0].value).toBe("number");
    expect(result.caseTypeStats[0].value).toBe(42);
  });
});
