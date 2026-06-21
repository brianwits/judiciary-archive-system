import { describe, expect, it } from "vitest";
import {
  caseRowToDto,
  caseFormDataToInput,
  resolveCaseType,
} from "@/contracts/cases";
import { archiveStoredCaseRpcRowToDto } from "@/contracts/archive";
import type { CaseRow } from "@/types/database";
import type { ArchiveStoredCaseRpcRow } from "@/contracts/archive";

function makeCaseRow(overrides: Partial<CaseRow> = {}): CaseRow {
  return {
    id: "case-1",
    case_number: "CR/123/2025",
    title: "State v. John Doe",
    court: "KBT",
    status: "open",
    filed_date: "2025-01-15",
    closed_date: null,
    description: null,
    case_type: null,
    case_category_code: null,
    court_station: null,
    court_division: null,
    year: null,
    plaintiff: "State",
    defendant: "John Doe",
    judge: "",
    archive_code: null,
    shelf_location: null,
    location_id: null,
    qr_barcode: null,
    notes: null,
    is_missing: false,
    created_by: null,
    created_at: "2025-01-15T08:00:00Z",
    updated_at: "2025-01-15T08:00:00Z",
    ...overrides,
  };
}

function makeArchiveRow(overrides: Partial<ArchiveStoredCaseRpcRow> = {}): ArchiveStoredCaseRpcRow {
  return {
    case_id: "case-1",
    case_number: "CR/123/2025",
    title: "State v. John Doe",
    case_type: null,
    case_category_code: null,
    court_station: "KBT",
    court_division: "High Court",
    year: 2025,
    plaintiff: "State",
    defendant: "John Doe",
    judge: "Hon. Magistrate Hassan",
    status: "open",
    archive_code: "KBT-CRI-2025-123",
    shelf_location: "R1-B1-R1-S1",
    filed_date: "2025-01-15",
    storage_path: "R1 › B1 › R1 › S1",
    matching_total: 1,
    case_category_name: null,
    ...overrides,
  };
}

describe("case type normalization", () => {
  it("infers Criminal from a CR prefix when the stored type is missing", () => {
    expect(resolveCaseType(null, "CR/123/2025")).toBe("Criminal");
  });

  it("keeps explicit Civil even when the case number looks criminal", () => {
    expect(resolveCaseType("Civil", "CR/123/2025")).toBe("Civil");
  });

  it("normalizes case DTOs using the case number prefix when case_type is blank", () => {
    const dto = caseRowToDto(makeCaseRow({ case_type: "" }));
    expect(dto.caseType).toBe("Criminal");
  });

  it("normalizes archive inventory rows using the case number prefix when case_type is blank", () => {
    const dto = archiveStoredCaseRpcRowToDto(makeArchiveRow({ case_type: "" }));
    expect(dto.caseType).toBe("Criminal");
  });

  it("uses the explicit case type from the form when provided", () => {
    const formData = new FormData();
    formData.set("case_number", "CR/777/2025");
    formData.set("title", "State v. Jane Doe");
    formData.set("court", "KBT");
    formData.set("status", "open");
    formData.set("case_type_id", "9");
    const input = caseFormDataToInput(formData);
    expect(input.caseType).toBe("Criminal");
    expect(input.caseNumber).toBe("HCCRC/777/2025");
  });

  it("requires an explicit case type for new case records", () => {
    const formData = new FormData();
    formData.set("case_number", "CR/777/2025");
    formData.set("title", "State v. Jane Doe");
    formData.set("court", "KBT");
    formData.set("status", "open");
    expect(() => caseFormDataToInput(formData)).toThrow();
  });
});
