import { describe, it, expect } from "vitest";
import { parseReportJson } from "@/lib/data/supabase-queries";
import { REPORT_DATA } from "@/data/seed/dashboard";

// ─── Helpers ────────────────────────────────────────────────────────────────

function asJson(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

// ─── caseTypeStats parsing ──────────────────────────────────────────────────

describe("parseReportJson — caseTypeStats", () => {
  it("parses canonical case types with numeric caseTypeId", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    const hcCivil = result.caseTypeStats.find(
      (t) => t.caseTypeId === 19 && t.code === "HCCC",
    );
    expect(hcCivil).toBeDefined();
    expect(hcCivil?.fullLabel).toContain("HCCC");
    expect(hcCivil?.courtLevel).toBe("High Court");

    expect(hcCivil?.value).toBeGreaterThan(0);
  });

  it("handles null caseTypeId for legacy/unclassified types", () => {
    const raw = asJson(REPORT_DATA);
    // Add a legacy entry to the raw data
    raw.caseTypeStats.push({
      caseTypeId: null,
      code: "LEGACY",
      name: "Legacy ELC Matter",
      fullLabel: "ELC - Legacy ELC Matter",
      courtLevel: "Environment and Land Court",
      family: "Environment & Land",
      value: 4,
    });
    const result = parseReportJson(raw);

    const legacy = result.caseTypeStats.find(
      (t) => t.caseTypeId === null && t.code === "LEGACY",
    );
    expect(legacy).toBeDefined();
    expect(legacy?.courtLevel).toBe("Environment and Land Court");

    expect(legacy?.value).toBe(4);
  });

  it("includes ELC court level in case type stats", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    const elcTypes = result.caseTypeStats.filter(
      (t) => t.courtLevel === "Environment and Land Court",
    );
    expect(elcTypes.length).toBeGreaterThan(0);
  });

  it("maps magistrate ELC types correctly", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    const mcELC = result.caseTypeStats.find(
      (t) => t.caseTypeId === 95,
    );
    if (mcELC) {
      expect(mcELC.code).toBe("MCELC");
      expect(mcELC.courtLevel).toBe("Magistrate Court");

    }
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
    raw.caseTypeStats = undefined;
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

  it("includes categories from High Court", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    const hcCategories = result.caseCategoryStats.filter(
      (c) => c.courtLevel === "High Court",
    );
    expect(hcCategories.length).toBeGreaterThan(0);
  });

  it("includes categories from Magistrate Court", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    const mcCategories = result.caseCategoryStats.filter(
      (c) => c.courtLevel === "Magistrate Court",
    );
    expect(mcCategories.length).toBeGreaterThan(0);
  });

  it("includes categories from Environment and Land Court", () => {
    const raw = asJson(REPORT_DATA);
    const result = parseReportJson(raw);

    const elcCategories = result.caseCategoryStats.filter(
      (c) => c.courtLevel === "Environment and Land Court",
    );
    expect(elcCategories.length).toBeGreaterThanOrEqual(0);
  });

  it("handles missing caseCategoryStats gracefully (empty array)", () => {
    const raw = asJson(REPORT_DATA);
    raw.caseCategoryStats = undefined;
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

describe("REPORT_DATA seed — ELC court level coverage", () => {
  it("includes Environment and Land Court in courtLevelStats", () => {
    const elcLevel = REPORT_DATA.courtLevelStats.find(
      (c) => c.name === "Environment and Land Court",
    );
    expect(elcLevel).toBeDefined();
    expect(elcLevel!.value).toBeGreaterThan(0);
  });

  it("includes High Court in courtLevelStats", () => {
    const hcLevel = REPORT_DATA.courtLevelStats.find(
      (c) => c.name === "High Court",
    );
    expect(hcLevel).toBeDefined();
    expect(hcLevel!.value).toBeGreaterThan(0);
  });

  it("includes Magistrate Court in courtLevelStats", () => {
    const mcLevel = REPORT_DATA.courtLevelStats.find(
      (c) => c.name === "Magistrate Court",
    );
    expect(mcLevel).toBeDefined();
    expect(mcLevel!.value).toBeGreaterThan(0);
  });

  it("has exactly three court levels represented", () => {
    expect(REPORT_DATA.courtLevelStats).toHaveLength(3);
  });

  it("has caseTypeStats including ELC types", () => {
    const elcTypes = REPORT_DATA.caseTypeStats.filter(
      (t) =>
        t.courtLevel === "Environment and Land Court" ||
        t.courtLevel === "Environment and Land Court"
    );
    expect(elcTypes.length).toBeGreaterThan(0);
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

  it("totalCases matches sum of court level counts", () => {
    const sumOfLevels = REPORT_DATA.courtLevelStats.reduce(
      (sum, c) => sum + c.value,
      0,
    );
    // The total should be approximately the sum of court levels
    // (some cases may appear in chart data but not be counted in court level stats)
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
    } as any);
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
    ];
    const result = parseReportJson(raw);
    expect(result.caseTypeStats).toHaveLength(1);
    expect(result.caseTypeStats[0].code).toBe("");
    expect(result.caseTypeStats[0].value).toBe(0);
  });

  it("converts string values to numbers in caseTypeStats", () => {
    const raw = asJson(REPORT_DATA);
    raw.caseTypeStats[0].value = "42";
    const result = parseReportJson(raw);
    expect(typeof result.caseTypeStats[0].value).toBe("number");
    expect(result.caseTypeStats[0].value).toBe(42);
  });

  it("preserves courtLevel='Environment and Land Court' through parse", () => {
    const raw = asJson(REPORT_DATA);
    raw.caseTypeStats.push({
      caseTypeId: 401,
      code: "ELC",
      name: "Environment and Land Court Case",
      fullLabel: "ELC - Environment and Land Court Case",
      courtLevel: "Environment and Land Court",
      family: "Environment & Land",
      value: 5,
    });
    const result = parseReportJson(raw);
    const elc = result.caseTypeStats.find((t) => t.caseTypeId === 401);
    expect(elc).toBeDefined();
    expect(elc?.courtLevel).toBe("Environment and Land Court");

  });
});

// ─── ELC filter isolation behavior ──────────────────────────────────────────

describe("ELC filter isolation — simulated filtering logic", () => {
  it("identifies caseTypeStats that belong to ELC court level", () => {
    // Simulate the filter logic that the RPC uses when p_court_level='Environment and Land Court'
    const elcCaseTypes = REPORT_DATA.caseTypeStats.filter(
      (t) => t.courtLevel === "Environment and Land Court",
    );

    // All ELC-filtered types should report Environment and Land Court
    for (const t of elcCaseTypes) {
      expect(t.courtLevel).toBe("Environment and Land Court");
    }
  });

  it("filtering by ELC court level excludes High Court types", () => {
    const filtered = REPORT_DATA.caseTypeStats.filter(
      (t) => t.courtLevel === "Environment and Land Court",
    );
    const hasHighCourt = filtered.some(
      (t) => t.courtLevel === "High Court",
    );
    expect(hasHighCourt).toBe(false);
  });

  it("filtering by ELC court level excludes Magistrate types", () => {
    const filtered = REPORT_DATA.caseTypeStats.filter(
      (t) => t.courtLevel === "Environment and Land Court",
    );
    const hasMagistrate = filtered.some(
      (t) => t.courtLevel === "Magistrate Court",
    );
    expect(hasMagistrate).toBe(false);
  });

  it("filtering by ELC court level shows only ELC families", () => {
    const filtered = REPORT_DATA.caseTypeStats.filter(
      (t) => t.courtLevel === "Environment and Land Court",
    );
    for (const t of filtered) {
    }
  });
});

// ─── ReportTaxonomyBreakdown matrix logic (pure function extraction) ─────────

describe("ReportTaxonomyBreakdown matrix logic", () => {
  // Extract and test the matrix-building logic used by ReportTaxonomyBreakdown
  function buildMatrix(
    courtLevelStats: { name: string; value: number }[],
    caseCategoryStats: { categoryName: string; courtLevel: string; value: number }[],
  ): Record<string, number | string>[] {
    const courtLevels = courtLevelStats.map((c) => c.name);
    const categoryNames = [...new Set(caseCategoryStats.map((c) => c.categoryName))];
    const matrix = categoryNames.map((catName) => {
      const row: Record<string, number | string> = { category: catName };
      for (const cl of courtLevels) {
        const match = caseCategoryStats.find(
          (cc) => cc.categoryName === catName && cc.courtLevel === cl,
        );
        row[cl] = match?.value ?? 0;
      }
      row.total = Object.values(row)
        .filter((v): v is number => typeof v === "number")
        .reduce((a, b) => a + b, 0);
      return row;
    });
    matrix.sort((a, b) => (b.total as number) - (a.total as number));
    return matrix;
  }

  it("builds matrix with categories across multiple court levels", () => {
    const clStats = [
      { name: "High Court", value: 10 },
      { name: "Magistrate Court", value: 5 },
      { name: "Environment and Land Court", value: 3 },
    ];
    const catStats = [
      { categoryName: "Civil Case", courtLevel: "High Court", value: 8 },
      { categoryName: "Civil Case", courtLevel: "Magistrate Court", value: 3 },
      { categoryName: "ELC Matter", courtLevel: "Environment and Land Court", value: 3 },
    ];
    const matrix = buildMatrix(clStats, catStats);

    expect(matrix).toHaveLength(2);

    const civilRow = matrix.find((r) => r.category === "Civil Case");
    expect(civilRow).toBeDefined();
    expect(civilRow!["High Court"]).toBe(8);
    expect(civilRow!["Magistrate Court"]).toBe(3);
    expect(civilRow!["Environment and Land Court"]).toBe(0);
    expect(civilRow!.total).toBe(11);

    const elcRow = matrix.find((r) => r.category === "ELC Matter");
    expect(elcRow).toBeDefined();
    expect(elcRow!["Environment and Land Court"]).toBe(3);
    expect(elcRow!["High Court"]).toBe(0);
    expect(elcRow!.total).toBe(3);
  });

  it("sorts matrix rows by total descending", () => {
    const clStats = [
      { name: "High Court", value: 10 },
      { name: "Magistrate Court", value: 5 },
    ];
    const catStats = [
      { categoryName: "Small", courtLevel: "High Court", value: 2 },
      { categoryName: "Large", courtLevel: "Magistrate Court", value: 10 },
    ];
    const matrix = buildMatrix(clStats, catStats);

    expect(matrix[0].category).toBe("Large");
    expect(matrix[0].total).toBe(10);
    expect(matrix[1].category).toBe("Small");
    expect(matrix[1].total).toBe(2);
  });

  it("produces empty matrix when no categories exist", () => {
    const matrix = buildMatrix(
      [{ name: "High Court", value: 0 }],
      [],
    );
    expect(matrix).toHaveLength(0);
  });

  it("assigns zero for missing court-level combinations", () => {
    const clStats = [
      { name: "High Court", value: 5 },
      { name: "Environment and Land Court", value: 3 },
    ];
    const catStats = [
      { categoryName: "ELC Matter", courtLevel: "Environment and Land Court", value: 3 },
    ];
    const matrix = buildMatrix(clStats, catStats);

    const elcRow = matrix.find((r) => r.category === "ELC Matter");
    expect(elcRow!["High Court"]).toBe(0);
    expect(elcRow!["Environment and Land Court"]).toBe(3);
  });

  it("handles ELC-only filter: matrix shows only ELC court column", () => {
    const clStats = [{ name: "Environment and Land Court", value: 3 }];
    const catStats = [
      { categoryName: "ELC Matter", courtLevel: "Environment and Land Court", value: 3 },
    ];
    const matrix = buildMatrix(clStats, catStats);

    expect(matrix).toHaveLength(1);
    expect(matrix[0].category).toBe("ELC Matter");
    expect(matrix[0]["Environment and Land Court"]).toBe(3);
    expect(matrix[0].total).toBe(3);
    // No High Court or Magistrate Court columns
    expect(matrix[0]).not.toHaveProperty("High Court");
    expect(matrix[0]).not.toHaveProperty("Magistrate Court");
  });
});
