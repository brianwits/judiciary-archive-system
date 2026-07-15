import { describe, expect, it } from "vitest";
import { computeDerived, type ReportData } from "@/lib/reports-computations";

function reportData(overrides: Partial<ReportData> = {}): ReportData {
  return {
    archiveGrowth: [{ month: "2026-01", count: 10 }],
    missingTrend: [{ month: "2026-01", count: 1 }],
    divisionStats: [{ name: "High Court", value: 4 }],
    judgeStats: [{ name: "Judge A", value: 3 }],
    ageBandStats: [
      { label: "0-2", value: 4 },
      { label: "3-5", value: 11 },
      { label: "6-10", value: 8 },
    ],
    courtLevelStats: [{ name: "High Court", value: 4 }],
    caseTypeStats: [],
    caseCategoryStats: [{ categoryCode: "HC_CRIMINAL", categoryName: "High Court Criminal Case", courtLevel: "High Court", value: 4 }],
    unclassifiedCount: 0,
    totalCases: 23,
    ...overrides,
  };
}

describe("computeDerived", () => {
  it("selects the top age band by highest count", () => {
    const derived = computeDerived(reportData());

    expect(derived.topAgeBand).toEqual({ label: "3-5", value: 11 });
  });
});
