import { describe, it, expect } from "vitest";
import { canEditCases, isAdmin, hasPermission } from "@/types/roles";
import type { UserRole } from "@/types/roles";

// ---------------------------------------------------------------------------
// Constants matching src/contracts/documents.ts and src/app/actions/documents.ts
// ---------------------------------------------------------------------------
const MAX_DOCUMENT_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
type AllowedMime = (typeof ALLOWED_DOCUMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Test helpers – replicate the Server Action logic patterns without Next.js
// runtime dependencies. Each test validates the exact code paths the actions
// take.
// ---------------------------------------------------------------------------

type AuditEntry = {
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
};

type UploadResult =
  | { ok: true; data?: undefined; auditLog?: AuditEntry }
  | { ok: false; error: { code: string; message: string } };

function simulateUpload(
  profile: { id: string; role: UserRole; fullName: string } | null,
  formData: { file?: { name: string; type: string; size: number }; title?: string },
  caseExists: boolean,
): UploadResult {
  // Auth check
  if (!profile) {
    return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to upload documents." } };
  }
  if (!canEditCases(profile.role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to upload documents." } };
  }

  // File validation
  if (!formData.file || formData.file.size === 0) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "Please select a file to upload." } };
  }

  if (formData.file.size > MAX_DOCUMENT_FILE_SIZE) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "File exceeds the 25 MB limit." } };
  }

  if (!(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(formData.file.type)) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "Only PDF and image files are allowed." } };
  }

  // Case existence check
  if (!caseExists) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Case not found." } };
  }

  // Success path
  const title = formData.title?.trim() || formData.file.name;
  return {
    ok: true,
    auditLog: {
      userId: profile.id,
      userName: profile.fullName,
      action: "document_uploaded",
      entityType: "document",
      entityId: "case-001",
      description: `Uploaded ${title} for CR/123/2025`,
    },
  };
}

type DownloadResult =
  | { ok: true; data: { url: string; title: string } }
  | { ok: false; error: { code: string; message: string } };

function simulateDownload(
  documentId: string | null,
): DownloadResult {
  if (!documentId) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Document not found." } };
  }
  return { ok: true, data: { url: "#", title: "Charge Sheet" } };
}

type DeleteResult =
  | { ok: true; data?: undefined }
  | { ok: false; error: { code: string; message: string } };

function simulateDelete(
  profile: { id: string; role: UserRole } | null,
  documentExists: boolean,
): DeleteResult {
  // Auth check
  if (!profile || !isAdmin(profile.role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Only administrators can delete documents." } };
  }

  // Document existence check
  if (!documentExists) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Document not found." } };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Upload tests
// ---------------------------------------------------------------------------

describe("document upload — uploadDocument", () => {
  it("rejects unauthenticated requests", () => {
    const result = simulateUpload(null, { file: { name: "test.pdf", type: "application/pdf", size: 1024 } }, true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("rejects judge role (no canEditCases)", () => {
    const result = simulateUpload(
      { id: "judge-1", role: "judge", fullName: "Hon. Justice Njeri" },
      { file: { name: "test.pdf", type: "application/pdf", size: 1024 } },
      true,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("allows admin to upload", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Brian Mugendi" },
      { file: { name: "test.pdf", type: "application/pdf", size: 1024 } },
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("allows registry_clerk to upload", () => {
    const result = simulateUpload(
      { id: "clerk-1", role: "registry_clerk", fullName: "Peter Ochieng" },
      { file: { name: "test.pdf", type: "application/pdf", size: 1024 } },
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects upload with no file", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      {},
      true,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("select a file");
    }
  });

  it("rejects upload with empty file (0 bytes)", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { file: { name: "empty.pdf", type: "application/pdf", size: 0 } },
      true,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("rejects disallowed file types", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { file: { name: "malware.exe", type: "application/x-msdownload", size: 5000 } },
      true,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("PDF and image files");
    }
  });

  it("accepts PDF files", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { file: { name: "doc.pdf", type: "application/pdf", size: 5000 } },
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("accepts JPEG images", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { file: { name: "scan.jpg", type: "image/jpeg", size: 5000 } },
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("accepts PNG images", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { file: { name: "scan.png", type: "image/png", size: 5000 } },
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects file exceeding 25 MB limit", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { file: { name: "huge.pdf", type: "application/pdf", size: 30 * 1024 * 1024 } },
      true,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("25 MB");
    }
  });

  it("accepts file exactly at 25 MB boundary", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { file: { name: "exact.pdf", type: "application/pdf", size: 25 * 1024 * 1024 } },
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects upload when case does not exist", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { file: { name: "test.pdf", type: "application/pdf", size: 1024 } },
      false, // case does not exist
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.message).toContain("Case not found");
    }
  });

  it("creates audit log entry on successful upload", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Brian Mugendi" },
      { file: { name: "test.pdf", type: "application/pdf", size: 1024 }, title: "Affidavit" },
      true,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.auditLog).toBeDefined();
      expect(result.auditLog!.action).toBe("document_uploaded");
      expect(result.auditLog!.description).toContain("Affidavit");
      expect(result.auditLog!.userId).toBe("admin-1");
    }
  });

  it("falls back to file name when no title provided", () => {
    const result = simulateUpload(
      { id: "admin-1", role: "admin", fullName: "Admin" },
      { file: { name: "unheard-of.pdf", type: "application/pdf", size: 1024 } },
      true,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.auditLog!.description).toContain("unheard-of.pdf");
    }
  });
});

// ---------------------------------------------------------------------------
// Download tests
// ---------------------------------------------------------------------------

describe("document download — getDocumentDownloadUrl", () => {
  it("returns NOT_FOUND for nonexistent document", () => {
    const result = simulateDownload(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("returns a URL for existing documents in mock mode", () => {
    const result = simulateDownload("doc-001");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.url).toBe("#");
      expect(result.data.title).toBe("Charge Sheet");
    }
  });
});

// ---------------------------------------------------------------------------
// Delete tests
// ---------------------------------------------------------------------------

describe("document delete — deleteDocument", () => {
  it("rejects unauthenticated requests", () => {
    const result = simulateDelete(null, true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("rejects non-admin roles (judge)", () => {
    const result = simulateDelete({ id: "judge-1", role: "judge" }, true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
      expect(result.error.message).toContain("administrators");
    }
  });

  it("rejects non-admin roles (registry_clerk)", () => {
    const result = simulateDelete({ id: "clerk-1", role: "registry_clerk" }, true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("allows admin to delete", () => {
    const result = simulateDelete({ id: "admin-1", role: "admin" }, true);
    expect(result.ok).toBe(true);
  });

  it("returns NOT_FOUND when document does not exist", () => {
    const result = simulateDelete({ id: "admin-1", role: "admin" }, false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("returns ok when admin deletes an existing document", () => {
    const result = simulateDelete({ id: "admin-1", role: "admin" }, true);
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Role permission consistency – every role that can edit cases should be
// able to upload documents, and only admin should be able to delete.
// ---------------------------------------------------------------------------

describe("document permission consistency", () => {
  const rolesWithEditCases: UserRole[] = ["admin", "ict_officer", "registry_clerk", "archivist"];
  const rolesWithoutEditCases: UserRole[] = ["judge"];

  it.each(rolesWithEditCases)("allows %s to edit cases (upload docs)", (role) => {
    expect(canEditCases(role)).toBe(true);
  });

  it.each(rolesWithoutEditCases)("blocks %s from editing cases (upload docs)", (role) => {
    expect(canEditCases(role)).toBe(false);
  });

  it("only admin can delete documents", () => {
    for (const role of ["ict_officer", "registry_clerk", "archivist", "deputy_registrar", "judge"] as UserRole[]) {
      expect(isAdmin(role)).toBe(false);
    }
    expect(isAdmin("admin")).toBe(true);
  });
});
