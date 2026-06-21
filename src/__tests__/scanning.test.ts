import { describe, expect, it } from "vitest";
import {
  normalizeScanCode,
  scanLookupSchema,
  type ScanMatchType,
} from "@/contracts/scanning";
import { SEED_CASES, SEED_CASE_NUMBER_ALIASES } from "@/data/seed/cases";
import { hasPermission, type UserRole } from "@/types/roles";

function simulateScan(
  profile: { role: UserRole } | null,
  code: string,
) {
  if (!profile || !hasPermission(profile.role, "upload_docs")) {
    return { ok: false, code: "FORBIDDEN" };
  }

  const parsed = scanLookupSchema.safeParse({ code });
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR" };
  }

  const normalized = parsed.data.code.toLowerCase();
  const alias = SEED_CASE_NUMBER_ALIASES.find(
    (item) => item.caseNumber.toLowerCase() === normalized,
  );
  const caseFile = SEED_CASES.find(
    (item) =>
      item.caseNumber.toLowerCase() === normalized ||
      item.qrBarcode?.toLowerCase() === normalized ||
      item.archiveCode.toLowerCase() === normalized ||
      item.id === alias?.caseId,
  );

  if (!caseFile) return { ok: false, code: "NOT_FOUND" };

  let matchedBy: ScanMatchType = "archive_code";
  if (caseFile.caseNumber.toLowerCase() === normalized) matchedBy = "case_number";
  if (caseFile.qrBarcode?.toLowerCase() === normalized) matchedBy = "qr_barcode";
  if (alias?.caseId === caseFile.id) matchedBy = "case_number_alias";

  return {
    ok: true,
    caseNumber: caseFile.caseNumber,
    matchedBy,
  };
}

describe("scanning contracts", () => {
  it("normalizes scanner input", () => {
    expect(normalizeScanCode("  QR-CR1232025  ")).toBe("QR-CR1232025");
  });

  it("rejects empty scan input", () => {
    const result = scanLookupSchema.safeParse({ code: "   " });
    expect(result.success).toBe(false);
  });

  it("accepts case numbers, QR codes, and archive codes", () => {
    expect(scanLookupSchema.safeParse({ code: "HCCR/123/2025" }).success).toBe(true);
    expect(scanLookupSchema.safeParse({ code: "QR-CR1232025" }).success).toBe(true);
    expect(scanLookupSchema.safeParse({ code: SEED_CASES[0].archiveCode }).success).toBe(true);
  });
});

describe("scanning action behavior", () => {
  it("blocks unauthenticated scans", () => {
    expect(simulateScan(null, "HCCR/123/2025")).toEqual({
      ok: false,
      code: "FORBIDDEN",
    });
  });

  it("allows archivist digital scan lookup through document upload permission", () => {
    const result = simulateScan({ role: "archivist" }, "HCCR/123/2025");
    expect(result).toMatchObject({
      ok: true,
      caseNumber: "HCCR/123/2025",
      matchedBy: "case_number",
    });
  });

  it("blocks roles without document upload permission", () => {
    const result = simulateScan({ role: "magistrate" }, "CR/123/2025");
    expect(result).toMatchObject({
      ok: false,
      code: "FORBIDDEN",
    });
  });

  it("matches QR barcode exactly", () => {
    const result = simulateScan({ role: "archivist" }, "QR-CR1232025");
    expect(result).toMatchObject({
      ok: true,
      matchedBy: "qr_barcode",
    });
  });

  it("returns not found for unknown codes", () => {
    expect(simulateScan({ role: "archivist" }, "NO-SUCH-FILE")).toEqual({
      ok: false,
      code: "NOT_FOUND",
    });
  });
});
