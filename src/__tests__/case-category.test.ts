import { describe, expect, it } from "vitest";
import {
  getCaseCategoryCode,
  getCaseCategoryLabel,
  getCaseTypeFromCategoryCode,
} from "@/lib/case-category";
import { inferCaseType } from "@/lib/case-type";

describe("case category resolution", () => {
  it("resolves a legacy criminal case number to the high-court criminal category by default", () => {
    expect(
      getCaseCategoryCode(null, "CR/123/2025", { caseType: "Criminal" }),
    ).toBe("HC_CRIMINAL");
  });

  it("resolves magistrate criminal matters to the magistrate criminal category", () => {
    expect(
      getCaseCategoryCode(null, "CR/123/2025", {
        caseType: "Criminal",
        courtDivision: "Magistrate Court",
      }),
    ).toBe("MC_CRIMINAL");
  });

  it("infers legacy magistrate prefixes correctly", () => {
    expect(inferCaseType("MCCR/E377/2025")).toBe("Criminal");
    expect(inferCaseType("MCTR/E057/2026")).toBe("Traffic");
  });

  it("keeps explicit canonical category codes stable", () => {
    expect(getCaseCategoryCode("HC_PROBATE", "PRO/078/2022")).toBe("HC_PROBATE");
    expect(getCaseCategoryLabel("HC_PROBATE")).toContain("Probate");
  });

  it("maps canonical category codes back to their broad case family", () => {
    expect(getCaseTypeFromCategoryCode("HC_FAMILY")).toBe("Family");
    expect(getCaseTypeFromCategoryCode("MC_TRAFFIC")).toBe("Traffic");
  });
});
