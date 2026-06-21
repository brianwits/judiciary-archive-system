import { describe, expect, it } from "vitest";
import { canonicalizeCaseNumber } from "@/lib/case-number";

describe("canonical case-number prefixes", () => {
  it("uses HCCR for High Court criminal cases", () => {
    expect(canonicalizeCaseNumber("CR/123/2025", "HC_CRIMINAL")).toBe(
      "HCCR/123/2025",
    );
    expect(canonicalizeCaseNumber("HCR/123/2025", "HC_CRIMINAL")).toBe(
      "HCCR/123/2025",
    );
  });

  it("uses MCCR for Magistrates criminal cases", () => {
    expect(canonicalizeCaseNumber("CR/567/2023", "MC_CRIMINAL")).toBe(
      "MCCR/567/2023",
    );
  });

  it("uses HCCC for High Court civil cases", () => {
    expect(canonicalizeCaseNumber("CIV/456/2024", "HC_CIVIL")).toBe(
      "HCCC/456/2024",
    );
  });

  it("preserves E-numbers and existing separators", () => {
    expect(canonicalizeCaseNumber("CR/E018/2023", "HC_CRIMINAL")).toBe(
      "HCCR/E018/2023",
    );
    expect(canonicalizeCaseNumber("HCR No. 13 of 2014", "HC_CRIMINAL")).toBe(
      "HCCR No. 13 of 2014",
    );
  });

  it("adds the selected category prefix to a prefix-less number", () => {
    expect(canonicalizeCaseNumber("123/2025", "HC_CRIMINAL")).toBe(
      "HCCR/123/2025",
    );
  });

  it("leaves categories with variable prefixes unchanged", () => {
    expect(canonicalizeCaseNumber("TRIB/12/2025", "TRIBUNAL_MATTER")).toBe(
      "TRIB/12/2025",
    );
  });
});
