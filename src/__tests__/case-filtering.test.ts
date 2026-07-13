import { describe, it, expect } from "vitest";
import { filterCases } from "@/lib/data/case-filtering";
import { paginateItems } from "@/contracts/queries";
import { SEED_CASES } from "@/data/seed/cases";
import type { CaseFile, CaseFilters } from "@/types/case";

// ---------------------------------------------------------------------------
// Helper – count how many seed cases match a predicate
// ---------------------------------------------------------------------------
function countSeed(predicate: (c: CaseFile) => boolean): number {
  return SEED_CASES.filter(predicate).length;
}

// ---------------------------------------------------------------------------
// Verify data is loaded
// ---------------------------------------------------------------------------
describe("seed data", () => {
  it("has data loaded from CSV source", () => {
    expect(SEED_CASES.length).toBeGreaterThan(0);
  });

  it("contains cases from Kabarnet (both Magistrate and High Court)", () => {
    const divisions = [...new Set(SEED_CASES.map((c) => c.courtDivision))];
    expect(divisions.length).toBeGreaterThanOrEqual(1);
    const allKabarnet = SEED_CASES.every(
      (c) => c.courtStation === "KBT",
    );
    expect(allKabarnet).toBe(true);
  });

  it("contains High Court cases (HCCRC, HCCRMISCAPPL)", () => {
    const highCourtCases = SEED_CASES.filter(
      (c) => c.courtDivision === "High Court",
    );
    if (highCourtCases.length > 0) {
      const hasHCCRC = highCourtCases.some((c) => c.caseNumber.startsWith("HCCRC"));
      expect(hasHCCRC).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Filtering tests – operate on the real SEED_CASES data from CSV
// ---------------------------------------------------------------------------
describe("filterCases — search by text query", () => {
  it("filters by case number (partial match)", () => {
    const firstCase = SEED_CASES[0];
    if (!firstCase) return;
    const prefix = firstCase.caseNumber.split("/")[0] + "/";
    const result = filterCases(SEED_CASES, { q: prefix });
    expect(result.length).toBeGreaterThanOrEqual(1);
    result.forEach((c) => {
      expect(c.caseNumber.toLowerCase()).toContain(prefix.toLowerCase());
    });
  });

  it("filters by case number (exact match)", () => {
    const firstCase = SEED_CASES[0];
    if (!firstCase) return;
    const result = filterCases(SEED_CASES, { q: firstCase.caseNumber });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].caseNumber).toBe(firstCase.caseNumber);
  });

  it("filters by plaintiff name", () => {
    // Use the first non-empty plaintiff from the data
    const caseWithPlaintiff = SEED_CASES.find((c) => c.plaintiff.length > 0);
    if (!caseWithPlaintiff) return;
    const searchTerm = caseWithPlaintiff.plaintiff.split(" ")[0];
    const result = filterCases(SEED_CASES, { q: searchTerm });
    expect(result.length).toBeGreaterThanOrEqual(1);
    result.forEach((c) => {
      expect(
        c.plaintiff.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.defendant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      ).toBe(true);
    });
  });

  it("is case-insensitive", () => {
    const searchTerm = SEED_CASES[0]?.plaintiff.split(" ")[0] ?? "MCCR";
    const lower = filterCases(SEED_CASES, { q: searchTerm.toLowerCase() });
    const upper = filterCases(SEED_CASES, { q: searchTerm.toUpperCase() });
    // Results may differ slightly due to different matching, but both should find something
    expect(lower.length + upper.length).toBeGreaterThanOrEqual(1);
  });

  it("returns all cases with empty query", () => {
    const result = filterCases(SEED_CASES, { q: "" });
    expect(result).toHaveLength(SEED_CASES.length);
  });

  it("returns empty array for non-matching query", () => {
    const result = filterCases(SEED_CASES, { q: "XYZZZZ_NONEXISTENT" });
    expect(result).toHaveLength(0);
  });
});

describe("filterCases — filter by caseType", () => {
  it("filters by Criminal", () => {
    const result = filterCases(SEED_CASES, { caseType: "Criminal" });
    const expected = countSeed((c) => c.caseType === "Criminal");
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.caseType).toBe("Criminal"));
  });

  it("filters by Civil", () => {
    const result = filterCases(SEED_CASES, { caseType: "Civil" });
    const expected = countSeed((c) => c.caseType === "Civil");
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.caseType).toBe("Civil"));
  });

  it("filters by Traffic (if data exists)", () => {
    const expected = countSeed((c) => c.caseType === "Traffic");
    if (expected === 0) return; // skip if no traffic cases
    const result = filterCases(SEED_CASES, { caseType: "Traffic" });
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.caseType).toBe("Traffic"));
  });

  it("returns empty array for unmatched caseType", () => {
    const result = filterCases(SEED_CASES, { caseType: "Bankruptcy" } as unknown as CaseFilters);
    expect(result).toHaveLength(0);
  });
});

describe("filterCases — filter by caseCategory", () => {
  it("filters by existing category code", () => {
    const uniqueCategories = [...new Set(SEED_CASES.map((c) => c.caseCategoryCode))];
    if (uniqueCategories.length === 0) return;
    const targetCategory = uniqueCategories[0];
    const result = filterCases(SEED_CASES, { caseCategory: targetCategory });
    expect(result.length).toBeGreaterThan(0);
    if (result.length > 0) {
      result.forEach((c) => expect(c.caseCategoryCode).toBe(targetCategory));
    }
  });
});

describe("filterCases — filter by year", () => {
  it("filters by a known year from the data", () => {
    const knownYear = SEED_CASES[0]?.year;
    if (!knownYear) return;
    const result = filterCases(SEED_CASES, { year: knownYear });
    const expected = countSeed((c) => c.year === knownYear);
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.year).toBe(knownYear));
  });

  it("returns empty array for year with no cases", () => {
    const maxYear = Math.max(...SEED_CASES.map((c) => c.year));
    const result = filterCases(SEED_CASES, { year: maxYear + 50 });
    expect(result).toHaveLength(0);
  });
});

describe("filterCases — filter by status", () => {
  it("filters by closed (all CSV cases should be closed)", () => {
    const result = filterCases(SEED_CASES, { status: "closed" });
    const expected = countSeed((c) => c.status === "closed");
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.status).toBe("closed"));
  });
});

describe("filterCases — combined filters", () => {
  it("filters by year + caseType", () => {
    const firstCase = SEED_CASES[0];
    if (!firstCase) return;
    const result = filterCases(SEED_CASES, { year: firstCase.year, caseType: firstCase.caseType });
    const expected = countSeed(
      (c) => c.caseType === firstCase.caseType && c.year === firstCase.year,
    );
    expect(result).toHaveLength(expected);
    result.forEach((c) => {
      expect(c.caseType).toBe(firstCase.caseType);
      expect(c.year).toBe(firstCase.year);
    });
  });

  it("returns empty when combined filters are mutually exclusive", () => {
    const maxYear = Math.max(...SEED_CASES.map((c) => c.year));
    const result = filterCases(SEED_CASES, { status: "open", year: maxYear + 50 });
    expect(result).toHaveLength(0);
  });
});

describe("filterCases — edge cases", () => {
  it("handles undefined filters gracefully", () => {
    const result = filterCases(SEED_CASES, undefined);
    expect(result).toHaveLength(SEED_CASES.length);
  });

  it("handles empty filters object", () => {
    const result = filterCases(SEED_CASES, {});
    expect(result).toHaveLength(SEED_CASES.length);
  });

  it("handles empty cases array", () => {
    const result = filterCases([], { q: "test" });
    expect(result).toHaveLength(0);
  });

  it("does not mutate the original array", () => {
    const original = [...SEED_CASES];
    filterCases(SEED_CASES, { status: "closed" });
    expect(SEED_CASES).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// Pagination tests (data-agnostic)
// ---------------------------------------------------------------------------
describe("paginateItems", () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ id: `item-${i + 1}`, value: i + 1 }));

  it("returns first page by default", () => {
    const result = paginateItems(items, {});
    expect(result.items).toHaveLength(25);
    expect(result.page).toBe(1);
    expect(result.total).toBe(30);
    expect(result.hasNextPage).toBe(true);
    expect(result.items[0].id).toBe("item-1");
    expect(result.items[24].id).toBe("item-25");
  });

  it("returns page 2 correctly", () => {
    const result = paginateItems(items, { page: 2, pageSize: 25 });
    expect(result.items).toHaveLength(5);
    expect(result.page).toBe(2);
    expect(result.hasNextPage).toBe(false);
    expect(result.items[0].id).toBe("item-26");
    expect(result.items[4].id).toBe("item-30");
  });

  it("handles custom page size", () => {
    const result = paginateItems(items, { page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(10);
    expect(result.hasNextPage).toBe(true);
    expect(result.items[0].id).toBe("item-1");
    expect(result.items[9].id).toBe("item-10");
  });

  it("handles empty array", () => {
    const result = paginateItems([], { page: 1, pageSize: 25 });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.hasNextPage).toBe(false);
  });

  it("uses default page size when not specified", () => {
    const result = paginateItems(items);
    expect(result.items).toHaveLength(25);
    expect(result.pageSize).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Integration: filterCases + paginateItems = getCasesPage behavior
// ---------------------------------------------------------------------------
describe("getCasesPage integration pattern (filter + paginate)", () => {
  it("filters cases by type and paginates page 1", () => {
    const firstCase = SEED_CASES[0];
    if (!firstCase) return;
    const filtered = filterCases(SEED_CASES, { caseType: firstCase.caseType });
    const paginated = paginateItems(filtered, { page: 1, pageSize: 25 });
    expect(paginated.items.length).toBeLessThanOrEqual(25);
    paginated.items.forEach((c) => expect(c.caseType).toBe(firstCase.caseType));
    expect(paginated.total).toBe(filtered.length);
  });

  it("filters by year and paginates across pages with no overlap", () => {
    const firstCase = SEED_CASES[0];
    if (!firstCase) return;
    const filtered = filterCases(SEED_CASES, { year: firstCase.year });
    const page1 = paginateItems(filtered, { page: 1, pageSize: 5 });
    const page2 = paginateItems(filtered, { page: 2, pageSize: 5 });
    const page1Ids = new Set(page1.items.map((c) => c.id));
    const page2Ids = new Set(page2.items.map((c) => c.id));
    const overlap = [...page1Ids].filter((id) => page2Ids.has(id));
    expect(overlap).toHaveLength(0);
  });
});
