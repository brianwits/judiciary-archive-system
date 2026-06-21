import { describe, expect, it } from "vitest";
import { CASE_TYPE_DEFINITIONS } from "@/data/case-types";

describe("authoritative case types", () => {
  it("contains the complete High and Magistrate Court catalogue", () => {
    expect(CASE_TYPE_DEFINITIONS).toHaveLength(69);
    expect(CASE_TYPE_DEFINITIONS.filter((item) => item.courtLevel === "Magistrate Court")).toHaveLength(34);
    expect(CASE_TYPE_DEFINITIONS.filter((item) => item.courtLevel === "High Court")).toHaveLength(35);
  });

  it("uses unique numeric identities while preserving duplicate source codes", () => {
    expect(new Set(CASE_TYPE_DEFINITIONS.map((item) => item.caseTypeId)).size).toBe(69);
    expect(
      CASE_TYPE_DEFINITIONS.filter((item) => item.code === "HCCHRPET").map((item) => item.caseTypeId),
    ).toEqual([58, 258]);
  });

  it("builds every full label from the exact source code and name", () => {
    for (const item of CASE_TYPE_DEFINITIONS) {
      expect(item.fullLabel).toBe(`${item.code} - ${item.caseType}`);
      expect(item.caseFamily).not.toBe("");
    }
  });
});
