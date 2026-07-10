import { describe, expect, it } from "vitest";
import { CASE_TYPE_DEFINITIONS } from "@/data/case-types";

describe("authoritative case types", () => {
  it("contains the complete High and Magistrate Court catalogue", () => {
    // Removed 6 Family case type definitions (IDs 22, 23, 25, 26, 62, 108); includes 4 ELC types (401-405)
    expect(CASE_TYPE_DEFINITIONS).toHaveLength(67);
    expect(CASE_TYPE_DEFINITIONS.filter((item) => item.courtLevel === "Magistrate Court")).toHaveLength(33);
    expect(CASE_TYPE_DEFINITIONS.filter((item) => item.courtLevel === "High Court")).toHaveLength(30);
    expect(CASE_TYPE_DEFINITIONS.filter((item) => item.courtLevel === "Environment and Land Court")).toHaveLength(4);
  });

  it("uses unique numeric identities while preserving duplicate source codes", () => {
    expect(new Set(CASE_TYPE_DEFINITIONS.map((item) => item.caseTypeId)).size).toBe(67);
    expect(
      CASE_TYPE_DEFINITIONS.filter((item) => item.code === "HCCHRPET").map((item) => item.caseTypeId),
    ).toEqual([58, 258]);
  });

  it("builds every full label from the exact source code and name", () => {
    for (const item of CASE_TYPE_DEFINITIONS) {
      expect(item.fullLabel).toBe(`${item.code} - ${item.caseType}`);
      expect(typeof item.caseFamily).toBe("string");
    }
  });
});
