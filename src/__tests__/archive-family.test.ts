import { describe, expect, it } from "vitest";
import {
  buildArchiveFamilyGroups,
  buildArchiveTypeSections,
  normalizeArchiveCourtLevel,
  normalizeArchiveFamily,
} from "@/lib/archive-family";
import type { ArchiveStoredCase } from "@/types/archive";

function storedCase(overrides: Partial<ArchiveStoredCase>): ArchiveStoredCase {
  return {
    id: "case-1",
    caseNumber: "HCCC/1/2024",
    title: "Alpha v Beta",
    caseType: "Civil",
    caseTypeId: 19,
    caseTypeCode: "HCCC",
    caseTypeName: "High Court Civil Case",
    caseTypeFullLabel: "HCCC - High Court Civil Case",
    caseFamily: "Civil",
    classificationStatus: "canonical",
    caseCategoryCode: "HC_CIVIL",
    caseCategoryName: "High Court Civil Case",
    courtStation: "KBT",
    courtDivision: "High Court",
    year: 2024,
    plaintiff: "Alpha",
    defendant: "Beta",
    judge: "",
    status: "archived",
    archiveCode: "ARC-1",
    shelfLocation: "R1-B1",
    filedDate: "2024-01-10",
    storagePath: "R1 › B1 › S1",
    locationSource: "generated",
    ...overrides,
  };
}

describe("normalizeArchiveFamily", () => {
  it("maps environment and land records to ELC", () => {
    expect(
      normalizeArchiveFamily({
        caseType: "ELC",
        caseFamily: "Environment & Land",
      }),
    ).toBe("ELC");
  });

  it("maps succession and probate records to Succession when the case type is succession", () => {
    expect(
      normalizeArchiveFamily({
        caseType: "Succession",
        caseFamily: "Succession & Probate",
      }),
    ).toBe("Succession");
  });

  it("falls back to Other for unknown values", () => {
    expect(normalizeArchiveFamily({ caseType: "Unknown", caseFamily: "Unknown" })).toBe("Other");
  });
});

describe("buildArchiveFamilyGroups", () => {
  it("groups and sorts cases by family and year", () => {
    const groups = buildArchiveFamilyGroups(
      [
        storedCase({ id: "c1", caseNumber: "HCCC/2/2024", year: 2024, caseType: "Civil", caseFamily: "Civil", storagePath: "R1 › B1 › S1" }),
        storedCase({ id: "c2", caseNumber: "CR/1/2023", year: 2023, caseType: "Criminal", caseFamily: "Criminal", caseCategoryCode: "HC_CRIMINAL", caseCategoryName: "High Court Criminal Case", storagePath: "R2 › B1 › S2" }),
        storedCase({ id: "c3", caseNumber: "MCSUCC/8/2022", year: 2022, caseType: "Succession", caseFamily: "Succession & Probate", caseCategoryCode: "MC_SUCCESSION", caseCategoryName: "Magistrate Court Succession Matter", storagePath: "R3 › B1 › S1" }),
        storedCase({ id: "c4", caseNumber: "HCCC/1/2025", year: 2025, caseType: "Civil", caseFamily: "Civil", storagePath: "R1 › B2 › S4" }),
      ],
    );

    expect(groups.map((group) => group.label)).toEqual(["Civil", "Criminal", "Succession"]);
    expect(groups[0]?.storagePaths).toEqual(["R1 › B1 › S1", "R1 › B2 › S4"]);
    expect(groups[0]?.cases.map((item) => item.caseNumber)).toEqual(["HCCC/1/2025", "HCCC/2/2024"]);
  });

  it("deduplicates exact storage paths and leaves groups empty when no paths exist", () => {
    const groups = buildArchiveFamilyGroups([
      storedCase({ id: "c1", caseType: "Civil", caseFamily: "Civil", storagePath: "R1 › B1 › S1" }),
      storedCase({ id: "c2", caseType: "Civil", caseFamily: "Civil", storagePath: "R1 › B1 › S1" }),
      storedCase({ id: "c3", caseType: "Commercial", caseFamily: "Commercial", storagePath: null }),
    ]);

    expect(groups.find((group) => group.label === "Civil")?.storagePaths).toEqual(["R1 › B1 › S1"]);
    expect(groups.find((group) => group.label === "Commercial")?.storagePaths).toEqual([]);
  });
});

describe("normalizeArchiveCourtLevel", () => {
  it("classifies high court case types as High Court", () => {
    expect(normalizeArchiveCourtLevel(storedCase({ caseTypeCode: "HCCC" }))).toBe("High Court");
  });

  it("classifies magistrate case types as Magistrate Court", () => {
    expect(normalizeArchiveCourtLevel(storedCase({ caseTypeCode: "MCCR", courtDivision: "Magistrate Court" }))).toBe(
      "Magistrate Court",
    );
  });

  it("classifies environment and land records as ELC", () => {
    expect(
      normalizeArchiveCourtLevel(
        storedCase({
          caseTypeCode: "ELC",
          caseTypeFullLabel: "ELC - Environment and Land Case",
          courtDivision: "Environment and Land Court",
        }),
      ),
    ).toBe("ELC");
  });
});

describe("buildArchiveTypeSections", () => {
  it("keeps similar case families separate across High Court, Magistrate Court, and ELC", () => {
    const sections = buildArchiveTypeSections([
      storedCase({
        id: "hc-1",
        caseNumber: "HCCC/2/2024",
        caseTypeCode: "HCCC",
        caseTypeFullLabel: "HCCC - High Court Civil Case",
        caseCategoryName: "High Court Civil Case",
        courtDivision: "High Court",
        storagePath: "HC Room › Shelf 01",
      }),
      storedCase({
        id: "mc-1",
        caseNumber: "MCC/4/2024",
        caseTypeCode: "MCCC",
        caseTypeFullLabel: "MCCC - Magistrate Civil Case",
        caseCategoryName: "Magistrate Civil Case",
        courtDivision: "Magistrate Court",
        storagePath: "MC Room › Shelf 07",
      }),
      storedCase({
        id: "elc-1",
        caseNumber: "ELC/3/2023",
        caseTypeCode: "ELC",
        caseType: "ELC",
        caseFamily: "Environment & Land",
        caseTypeFullLabel: "ELC - Environment and Land Case",
        caseCategoryName: "Environment and Land Case",
        courtDivision: "Environment and Land Court",
        storagePath: "ELC Room › Rack 03",
      }),
    ]);

    expect(sections.map((section) => section.label)).toEqual(["High Court", "Magistrate Court", "ELC"]);
    expect(sections[0]?.groups[0]?.label).toBe("HCCC - High Court Civil Case");
    expect(sections[1]?.groups[0]?.label).toBe("MCCC - Magistrate Civil Case");
    expect(sections[2]?.groups[0]?.label).toBe("ELC - Environment and Land Case");
  });

  it("deduplicates storage paths and sorts cases newest first within each type group", () => {
    const sections = buildArchiveTypeSections([
      storedCase({
        id: "hc-older",
        caseNumber: "HCCC/5/2023",
        year: 2023,
        storagePath: "HC Room › Shelf 01",
      }),
      storedCase({
        id: "hc-newer",
        caseNumber: "HCCC/1/2025",
        year: 2025,
        storagePath: "HC Room › Shelf 01",
      }),
      storedCase({
        id: "hc-missing",
        caseNumber: "HCCC/8/2024",
        year: 2024,
        status: "missing",
        storagePath: null,
        shelfLocation: null,
      }),
    ]);

    const civilGroup = sections[0]?.groups[0];
    expect(civilGroup?.storagePaths).toEqual(["HC Room › Shelf 01"]);
    expect(civilGroup?.missingCount).toBe(1);
    expect(civilGroup?.cases.map((item) => item.caseNumber)).toEqual(["HCCC/1/2025", "HCCC/8/2024", "HCCC/5/2023"]);
  });
});
