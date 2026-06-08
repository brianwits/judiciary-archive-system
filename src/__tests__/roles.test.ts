import { describe, it, expect } from "vitest";
import {
  hasPermission,
  canEditCases,
  isAdmin,
  canManageUsers,
  canViewAudit,
  type UserRole,
} from "@/types/roles";

describe("Role permissions", () => {
  describe("hasPermission", () => {
    it("grants admin all permissions", () => {
      const perms = [
        "view_cases", "edit_cases", "archive_ops", "file_movement",
        "upload_docs", "reports", "user_mgmt", "audit_logs", "registry_ops",
      ] as const;
      for (const perm of perms) {
        expect(hasPermission("admin", perm)).toBe(true);
      }
    });

    it("limits judge permissions to view_cases, file_movement, reports", () => {
      expect(hasPermission("judge", "view_cases")).toBe(true);
      expect(hasPermission("judge", "file_movement")).toBe(true);
      expect(hasPermission("judge", "reports")).toBe(true);
      expect(hasPermission("judge", "edit_cases")).toBe(false);
      expect(hasPermission("judge", "user_mgmt")).toBe(false);
      expect(hasPermission("judge", "upload_docs")).toBe(false);
    });

    it("denies unknown roles", () => {
      expect(hasPermission("unknown" as UserRole, "view_cases")).toBe(false);
    });
  });

  describe("canEditCases", () => {
    it("allows admin, ict_officer, registry_clerk, archivist, deputy_registrar", () => {
      const allowed: UserRole[] = ["admin", "ict_officer", "registry_clerk", "archivist", "deputy_registrar"];
      for (const role of allowed) {
        expect(canEditCases(role)).toBe(true);
      }
    });

    it("denies judge", () => {
      expect(canEditCases("judge")).toBe(false);
    });
  });

  describe("isAdmin", () => {
    it("returns true only for admin", () => {
      expect(isAdmin("admin")).toBe(true);
      expect(isAdmin("judge")).toBe(false);
      expect(isAdmin("registry_clerk")).toBe(false);
    });
  });

  describe("canManageUsers", () => {
    it("allows admin and ict_officer", () => {
      expect(canManageUsers("admin")).toBe(true);
      expect(canManageUsers("ict_officer")).toBe(true);
    });

    it("denies others", () => {
      expect(canManageUsers("judge")).toBe(false);
      expect(canManageUsers("registry_clerk")).toBe(false);
    });
  });

  describe("canViewAudit", () => {
    it("allows admin, ict_officer, deputy_registrar", () => {
      expect(canViewAudit("admin")).toBe(true);
      expect(canViewAudit("ict_officer")).toBe(true);
      expect(canViewAudit("deputy_registrar")).toBe(true);
    });

    it("denies judge, registry_clerk, archivist", () => {
      expect(canViewAudit("judge")).toBe(false);
      expect(canViewAudit("registry_clerk")).toBe(false);
      expect(canViewAudit("archivist")).toBe(false);
    });
  });
});
