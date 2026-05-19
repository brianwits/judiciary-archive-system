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

export const MAIN_NAV: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Active Cases", href: "/cases", icon: FileText, badge: 247 },
  { title: "Archive Storage", href: "/archive", icon: Archive, permission: "archive_ops" },
  { title: "File Tracking", href: "/tracking", icon: Truck, permission: "file_movement" },
  { title: "Registry Operations", href: "/registry", icon: ClipboardList, badge: 12, permission: "registry_ops" },
  { title: "Digital Scanning", href: "/scanning", icon: ScanLine, permission: "upload_docs" },
  { title: "Reports", href: "/reports", icon: FileSearch, permission: "reports" },
  { title: "Audit Logs", href: "/audit", icon: ScrollText, permission: "audit_logs" },
  { title: "User Management", href: "/users", icon: Users, permission: "user_mgmt" },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const ADMIN_ROUTES = ["/users"];
export const AUDIT_ROUTES = ["/audit"];
