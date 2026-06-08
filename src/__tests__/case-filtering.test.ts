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
// Filtering tests – operate on the real SEED_CASES data (30 cases)
// ---------------------------------------------------------------------------

describe("filterCases — search by text query", () => {
  it("filters by case number (partial match)", () => {
    const result = filterCases(SEED_CASES, { q: "CR/" });
    // 2 explicit criminal cases + ~4 generated (generated: CRI/101/2020 etc.)
    expect(result.length).toBeGreaterThanOrEqual(2);
    result.forEach((c) => {
      expect(c.caseNumber.toLowerCase()).toContain("cr/");
    });
  });

  it("filters by case number (exact match)", () => {
    const result = filterCases(SEED_CASES, { q: "CR/123/2025" });
    expect(result).toHaveLength(1);
    expect(result[0].caseNumber).toBe("CR/123/2025");
  });

  it("filters by plaintiff name", () => {
    const result = filterCases(SEED_CASES, { q: "state" });
    expect(result.length).toBeGreaterThanOrEqual(2);
    result.forEach((c) => {
      expect(
        c.plaintiff.toLowerCase().includes("state") ||
        c.defendant.toLowerCase().includes("state") ||
        c.caseNumber.toLowerCase().includes("state"),
      ).toBe(true);
    });
  });

  it("filters by defendant name", () => {
    const result = filterCases(SEED_CASES, { q: "John Doe" });
    expect(result).toHaveLength(1);
    expect(result[0].defendant).toBe("John Doe");
  });

  it("filters by archive code", () => {
    const result = filterCases(SEED_CASES, { q: "KBT-CR" });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("is case-insensitive", () => {
    const lower = filterCases(SEED_CASES, { q: "state" });
    const upper = filterCases(SEED_CASES, { q: "STATE" });
    expect(lower).toEqual(upper);
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

  it("filters by Family", () => {
    const result = filterCases(SEED_CASES, { caseType: "Family" });
    const expected = countSeed((c) => c.caseType === "Family");
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.caseType).toBe("Family"));
  });

  it("filters by ELC", () => {
    const result = filterCases(SEED_CASES, { caseType: "ELC" });
    const expected = countSeed((c) => c.caseType === "ELC");
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.caseType).toBe("ELC"));
  });

  it("filters by Commercial", () => {
    const result = filterCases(SEED_CASES, { caseType: "Commercial" });
    const expected = countSeed((c) => c.caseType === "Commercial");
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.caseType).toBe("Commercial"));
  });

  it("returns empty array for unmatched caseType", () => {
    const result = filterCases(SEED_CASES, { caseType: "Bankruptcy" } as unknown as CaseFilters);
    expect(result).toHaveLength(0);
  });
});

describe("filterCases — filter by year", () => {
  it("filters by 2025", () => {
    const result = filterCases(SEED_CASES, { year: 2025 });
    const expected = countSeed((c) => c.year === 2025);
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.year).toBe(2025));
  });

  it("filters by 2024", () => {
    const result = filterCases(SEED_CASES, { year: 2024 });
    const expected = countSeed((c) => c.year === 2024);
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.year).toBe(2024));
  });

  it("filters by 2023", () => {
    const result = filterCases(SEED_CASES, { year: 2023 });
    const expected = countSeed((c) => c.year === 2023);
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.year).toBe(2023));
  });

  it("returns empty array for year with no cases", () => {
    const result = filterCases(SEED_CASES, { year: 2015 });
    expect(result).toHaveLength(0);
  });
});

describe("filterCases — filter by status", () => {
  it("filters by open", () => {
    const result = filterCases(SEED_CASES, { status: "open" });
    const expected = countSeed((c) => c.status === "open");
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.status).toBe("open"));
  });

  it("filters by closed", () => {
    const result = filterCases(SEED_CASES, { status: "closed" });
    const expected = countSeed((c) => c.status === "closed");
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.status).toBe("closed"));
  });

  it("filters by archived", () => {
    const result = filterCases(SEED_CASES, { status: "archived" });
    const expected = countSeed((c) => c.status === "archived");
    expect(result).toHaveLength(expected);
    result.forEach((c) => expect(c.status).toBe("archived"));
  });

  it("filters by missing", () => {
    const result = filterCases(SEED_CASES, { status: "missing" });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("missing");
  });

  it("filters by pending_return", () => {
    const result = filterCases(SEED_CASES, { status: "pending_return" });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("pending_return");
  });
});

describe("filterCases — combined filters", () => {
  it("filters by status + caseType", () => {
    const result = filterCases(SEED_CASES, { status: "open", caseType: "Criminal" });
    // Only CR/123/2025 is open Criminal (CR/567/2023 is missing)
    expect(result.length).toBeGreaterThanOrEqual(1);
    result.forEach((c) => {
      expect(c.status).toBe("open");
      expect(c.caseType).toBe("Criminal");
    });
  });

  it("filters by year + caseType", () => {
    const result = filterCases(SEED_CASES, { year: 2023, caseType: "Criminal" });
    // CR/567/2023 (seed) + 1 generated Criminal 2023 case
    expect(result).toHaveLength(2);
    result.forEach((c) => {
      expect(c.caseType).toBe("Criminal");
      expect(c.year).toBe(2023);
    });
  });

  it("filters by search + status", () => {
    const result = filterCases(SEED_CASES, { q: "ABC", status: "closed" });
    // CIV/456/2024: ABC Enterprises v. XYZ Holdings, closed
    expect(result).toHaveLength(1);
    expect(result[0].caseNumber).toBe("CIV/456/2024");
  });

  it("filters by search + caseType + year (triple filter)", () => {
    const result = filterCases(SEED_CASES, { q: "Tech", caseType: "Commercial", year: 2024 });
    expect(result).toHaveLength(1);
    expect(result[0].caseNumber).toBe("COM/234/2024");
  });

  it("returns empty when combined filters are mutually exclusive", () => {
    const result = filterCases(SEED_CASES, { status: "open", year: 2015 });
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
    filterCases(SEED_CASES, { status: "open" });
    expect(SEED_CASES).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// Pagination tests
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

  it("handles last page with fewer items", () => {
    const result = paginateItems(items, { page: 3, pageSize: 10 });
    expect(result.items).toHaveLength(10);
    expect(result.hasNextPage).toBe(false);
  });

  it("returns empty items for page beyond total", () => {
    const result = paginateItems(items, { page: 10, pageSize: 10 });
    expect(result.items).toHaveLength(0);
    expect(result.hasNextPage).toBe(false);
    expect(result.total).toBe(30);
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
  it("filters Criminal cases and paginates page 1", () => {
    const filtered = filterCases(SEED_CASES, { caseType: "Criminal" });
    const paginated = paginateItems(filtered, { page: 1, pageSize: 25 });
    expect(paginated.items.length).toBeLessThanOrEqual(25);
    paginated.items.forEach((c) => expect(c.caseType).toBe("Criminal"));
    expect(paginated.total).toBe(filtered.length);
  });

  it("filters 2024 cases and paginates across pages", () => {
    const filtered = filterCases(SEED_CASES, { year: 2024 });
    const page1 = paginateItems(filtered, { page: 1, pageSize: 5 });
    const page2 = paginateItems(filtered, { page: 2, pageSize: 5 });
    // Should not overlap
    const page1Ids = new Set(page1.items.map((c) => c.id));
    const page2Ids = new Set(page2.items.map((c) => c.id));
    const overlap = [...page1Ids].filter((id) => page2Ids.has(id));
    expect(overlap).toHaveLength(0);
  });

  it("search + pagination: finds 'State' cases", () => {
    const filtered = filterCases(SEED_CASES, { q: "State" });
    const paginated = paginateItems(filtered, { page: 1, pageSize: 25 });
    expect(paginated.items.length).toBe(filtered.length);
    expect(paginated.items.length).toBeGreaterThanOrEqual(1);
    // State appears as plaintiff in criminal cases (CR/123/2025, CR/567/2023)
    paginated.items.forEach((c) => {
      expect(
        c.plaintiff.toLowerCase().includes("state") ||
        c.defendant.toLowerCase().includes("state"),
      ).toBe(true);
    });
  });
});
