"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Scale } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { navItemsWithBadges, type NavCounts } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layout/sidebar-provider";

type AppSidebarProps = {
  role: UserRole;
  navCounts: NavCounts;
};

export function AppSidebar({ role, navCounts }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isMobileOpen, closeMobile } = useSidebar();
  // Show full labels on mobile regardless of collapsed state
  const showLabels = !collapsed || isMobileOpen;
  const navItems = useMemo(() => navItemsWithBadges(navCounts), [navCounts]);

  // Lock body scroll and handle Escape key when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeMobile();
      };
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [isMobileOpen, closeMobile]);

  const visibleNav = navItems.filter(
    (item) => !item.permission || hasPermission(role, item.permission),
  );

  const sidebarContent = (
    <>
      {/* Branding header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border/80 px-4 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Scale className="size-5" />
        </div>
        {showLabels && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">Judiciary Archive</p>
            <p className="truncate text-xs text-sidebar-foreground/70">Court File System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {visibleNav.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/78 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground",
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <Icon className="size-4 shrink-0 transition-transform duration-200 will-change-transform group-hover:scale-110" />
              {showLabels && (
                <>
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.liveBadge !== undefined && (
                    <Badge className="bg-accent text-accent-foreground text-xs">
                      {item.liveBadge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden border-t border-sidebar-border/80 p-2 md:block">
        <Button
          variant="ghost"
          size="icon"
          className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => setCollapsed((v) => !v)}
        >
          <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
          onTouchEnd={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — inline on desktop, fixed overlay on mobile */}
      <aside
        className={cn(
          "flex h-full flex-col bg-gradient-to-b from-sidebar to-sidebar/95 text-sidebar-foreground transition-all duration-300 print:hidden",
          // Desktop: inline column
          "hidden md:flex",
          collapsed ? "md:w-16" : "md:w-64",
          // Mobile: fixed overlay sliding from left
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:w-auto md:static md:z-auto",
          "shadow-2xl md:shadow-xl md:shadow-primary/10",
      isMobileOpen
        ? "translate-x-0"
        : "-translate-x-full md:translate-x-0",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
