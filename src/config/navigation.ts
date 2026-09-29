import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ClipboardList,
  FileSearch,
  FileText,
  LayoutDashboard,
  ScanLine,
  ScrollText,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import type { Permission } from "@/types/roles";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  permission?: Permission;
};

export type NavItemWithBadge = NavItem & {
  liveBadge?: number;
};

export type NavCounts = {
  openCases: number;
  pendingRegistry: number;
};

export function navItemsWithBadges(counts: NavCounts): NavItemWithBadge[] {
  return MAIN_NAV.map((item) => {
    if (item.href === "/cases" && counts.openCases > 0) {
      return { ...item, liveBadge: counts.openCases };
    }
    if (item.href === "/registry" && counts.pendingRegistry > 0) {
      return { ...item, liveBadge: counts.pendingRegistry };
    }
    return item;
  });
}

export const MAIN_NAV: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Active Cases", href: "/cases", icon: FileText },
  { title: "Archive Storage", href: "/archive", icon: Archive },
  { title: "File Tracking", href: "/tracking", icon: Truck, permission: "file_movement" },
  { title: "Digital Scanning", href: "/scanning", icon: ScanLine, permission: "upload_docs" },
  { title: "Registry Operations", href: "/registry", icon: ClipboardList, permission: "registry_ops" },
  { title: "Reports", href: "/reports", icon: FileSearch, permission: "reports" },
  { title: "Audit Logs", href: "/audit", icon: ScrollText, permission: "audit_logs" },
  { title: "User Management", href: "/users", icon: Users, permission: "user_mgmt" },
  { title: "Settings", href: "/settings", icon: Settings },
];

/** Longest-prefix match vs {@link MAIN_NAV} items that declare a permission (excluding `/`). */
export { permissionRequiredForAppPath } from "@/config/navigation-permissions";

/**
 * Resolves the effective navigation path for active link highlighting in the sidebar.
 * When detail pages (like /cases/[id] or /archive/rooms/[roomId]) are reached from a
 * specific context indicated by the `from` query param (e.g. "archive" or "dashboard"),
 * the highlighted nav item matches the origin section rather than jumping.
 */
export function getEffectiveActivePath(pathname: string, fromParam: string | null): string {
  if (!fromParam) return pathname;

  const normalizedFrom = fromParam.trim().toLowerCase();

  // If viewing a case details page: /cases/[id]
  if (pathname.startsWith("/cases/")) {
    if (normalizedFrom === "archive" || normalizedFrom === "/archive") {
      return "/archive";
    }
    if (
      normalizedFrom === "dashboard" ||
      normalizedFrom === "/" ||
      normalizedFrom === "/dashboard"
    ) {
      return "/";
    }
    if (normalizedFrom === "cases" || normalizedFrom === "/cases") {
      return "/cases";
    }
    if (normalizedFrom === "tracking" || normalizedFrom === "/tracking") {
      return "/tracking";
    }
  }

  // If viewing an archive room details page: /archive/rooms/[roomId]
  if (pathname.startsWith("/archive/rooms/")) {
    if (
      normalizedFrom === "dashboard" ||
      normalizedFrom === "/" ||
      normalizedFrom === "/dashboard"
    ) {
      return "/";
    }
    if (normalizedFrom === "archive" || normalizedFrom === "/archive") {
      return "/archive";
    }
  }

  return pathname;
}
