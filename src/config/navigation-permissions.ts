import type { Permission } from "@/types/roles";

/** Route permissions only — safe for middleware (no React/icon imports). */
const GATED_NAV_ROUTES: { href: string; permission: Permission }[] = [
  { href: "/tracking", permission: "file_movement" },
  { href: "/scanning", permission: "upload_docs" },
  { href: "/registry", permission: "registry_ops" },
  { href: "/reports", permission: "reports" },
  { href: "/audit", permission: "audit_logs" },
  { href: "/users", permission: "user_mgmt" },
];

/** Longest-prefix match for routes that declare a permission (excluding `/`). */
export function permissionRequiredForAppPath(pathname: string): Permission | undefined {
  const gated = [...GATED_NAV_ROUTES].sort((a, b) => b.href.length - a.href.length);

  for (const item of gated) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.permission;
    }
  }

  return undefined;
}
