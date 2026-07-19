import { describe, expect, it } from "vitest";
import {
  decorateMovement,
  movementFamilyDbValues,
  movementMatchesFilters,
  paginateFilteredMovements,
  sortMovementsOperationally,
  summarizeMovements,
} from "@/lib/movement-utils";
import type { FileMovement } from "@/types/movement";

function movement(overrides: Partial<FileMovement>): FileMovement {
  return {
    id: "mov-1",
    caseId: "case-1",
    caseNumber: "HCCC/1/2024",
    caseTitle: "Alpha v Beta",
    caseFamily: "Civil",
    courtDivision: "High Court",
    archiveCode: "ARC-1",
    shelfLocation: "R1-B1",
    checkedOutBy: "user-1",
    checkedOutByName: "User",
    destinationOffice: "Registry",
    purpose: "Review",
    expectedReturnDate: "2099-01-10",
    actualReturnDate: null,
    status: "checked_out",
    isOpen: true,
    isOverdue: false,
    createdAt: "2026-07-14T08:00:00Z",
    updatedAt: "2026-07-14T08:00:00Z",
    ...overrides,
  };
}

describe("decorateMovement", () => {
  it("computes overdue state from status and dates", () => {
    const item = decorateMovement({
      ...movement({
        expectedReturnDate: "2020-01-01",
        status: "checked_out",
        caseFamily: "Criminal",
      }),
      caseType: "Criminal",
    });

    expect(item.caseFamily).toBe("Criminal");
    expect(item.isOpen).toBe(true);
    expect(item.isOverdue).toBe(true);
  });
});

describe("movement filtering and sorting", () => {
  it("maps normalized family labels to all related database families", () => {
    expect(movementFamilyDbValues("Succession")).toEqual(["Succession & Probate"]);
    expect(movementFamilyDbValues("Civil")).toContain("Judicial Review");
    expect(movementFamilyDbValues("Criminal")).toContain("Anti-Corruption & Economic Crimes");
  });

  it("matches open and family filters", () => {
    const item = decorateMovement({ ...movement({ caseFamily: "Civil" }), caseType: "Civil" });
    expect(movementMatchesFilters(item, { status: "open", family: "Civil" })).toBe(true);
    expect(movementMatchesFilters(item, { status: "returned" })).toBe(false);
  });

  it("keeps date-overdue open movements in the overdue view", () => {
    const item = decorateMovement({
      ...movement({ status: "checked_out", expectedReturnDate: "2020-01-01" }),
      caseType: "Civil",
    });

    expect(item.status).toBe("checked_out");
    expect(movementMatchesFilters(item, { status: "overdue" })).toBe(true);
  });

  it("sorts overdue items ahead of regular open movements", () => {
    const sorted = sortMovementsOperationally([
      decorateMovement({ ...movement({ id: "a", expectedReturnDate: "2099-01-10" }), caseType: "Civil" }),
      decorateMovement({ ...movement({ id: "b", expectedReturnDate: "2020-01-01" }), caseType: "Civil" }),
    ]);

    expect(sorted[0]?.id).toBe("b");
  });

  it("filters by family before paginating the returned rows", () => {
    const movements = [
      decorateMovement({ ...movement({ id: "a", caseFamily: "Criminal" }), caseType: "Criminal" }),
      decorateMovement({ ...movement({ id: "b", caseFamily: "Civil" }), caseType: "Civil" }),
      decorateMovement({ ...movement({ id: "c", caseFamily: "Criminal" }), caseType: "Criminal" }),
      decorateMovement({ ...movement({ id: "d", caseFamily: "Civil" }), caseType: "Civil" }),
    ];

    const page = paginateFilteredMovements(movements, { family: "Civil" }, 0, 1);

    expect(page.map((item) => item.id)).toEqual(["b", "d"]);
  });

  it("filters derived overdue state before paginating", () => {
    const movements = [
      decorateMovement({ ...movement({ id: "future-a", expectedReturnDate: "2099-01-10" }), caseType: "Civil" }),
      decorateMovement({ ...movement({ id: "overdue-a", expectedReturnDate: "2020-01-01" }), caseType: "Civil" }),
      decorateMovement({ ...movement({ id: "future-b", expectedReturnDate: "2099-02-10" }), caseType: "Civil" }),
      decorateMovement({ ...movement({ id: "overdue-b", expectedReturnDate: "2020-02-01" }), caseType: "Civil" }),
    ];

    const page = paginateFilteredMovements(movements, { status: "overdue" }, 0, 1);

    expect(page.map((item) => item.id)).toEqual(["overdue-a", "overdue-b"]);
  });
});

describe("summarizeMovements", () => {
  it("counts open, overdue, in transit, and returned today correctly", () => {
    const today = new Date().toISOString();
    const summary = summarizeMovements([
      decorateMovement({ ...movement({ id: "open", status: "checked_out" }), caseType: "Civil" }),
      decorateMovement({ ...movement({ id: "transit", status: "in_transit" }), caseType: "Civil" }),
      decorateMovement({ ...movement({ id: "overdue", expectedReturnDate: "2020-01-01" }), caseType: "Civil" }),
      decorateMovement({
        ...movement({
          id: "returned",
          status: "returned",
          actualReturnDate: today,
        }),
        caseType: "Civil",
      }),
    ]);

    expect(summary.openCount).toBe(3);
    expect(summary.inTransitCount).toBe(1);
    expect(summary.overdueCount).toBe(1);
    expect(summary.returnedTodayCount).toBe(1);
  });
});
