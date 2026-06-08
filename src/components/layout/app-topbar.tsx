"use client";

import Link from "next/link";
import { ChevronDown, Menu, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { signOut } from "@/app/actions/auth";
import { useMemo } from "react";
import { navItemsWithBadges, type NavCounts } from "@/config/navigation";
import { AlertsMenu } from "@/components/layout/alerts-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Alert } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import type { SessionProfile } from "@/lib/auth";
import { ROLE_LABELS, hasPermission } from "@/types/roles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type AppTopbarProps = {
  profile: SessionProfile;
  navCounts: NavCounts;
  alerts: Alert[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppTopbar({ profile, navCounts, alerts }: AppTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const navItems = useMemo(() => navItemsWithBadges(navCounts), [navCounts]);
  const visibleNav = navItems.filter(
    (item) => !item.permission || hasPermission(profile.role, item.permission),
  );

  return (
    <header className="flex h-15 shrink-0 items-center gap-4 border-b border-sidebar-border/80 bg-gradient-to-r from-primary to-primary/92 px-4 text-primary-foreground shadow-sm backdrop-blur-sm print:hidden">
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden text-primary-foreground hover:bg-white/10" />}>
          <Menu className="size-5" />
          <span className="sr-only">Open navigation</span>
        </SheetTrigger>
        <SheetContent side="left" className="bg-sidebar p-0 text-sidebar-foreground" showCloseButton={false}>
          <SheetHeader className="border-b border-sidebar-border">
            <SheetTitle className="text-sidebar-foreground">Judiciary Archive</SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 p-2">
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
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground",
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                  )}
                  <Icon className="size-4 transition-transform duration-200 will-change-transform group-hover:scale-110" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <form action="/search" method="get" className="mx-auto hidden w-full max-w-xl md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary-foreground/50" />
          <Input
            name="q"
            placeholder="Search files, cases, or registry numbers..."
            className="border-white/10 bg-white/10 pl-9 text-primary-foreground shadow-none placeholder:text-primary-foreground/55 hover:bg-white/15 focus-visible:border-accent focus-visible:ring-accent/45"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle className="text-primary-foreground hover:bg-white/10" />
        <AlertsMenu alerts={alerts} />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 text-primary-foreground outline-none hover:bg-white/10">
            <Avatar className="size-8 border-2 border-accent">
              <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                {getInitials(profile.fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm lg:inline">{profile.fullName}</span>
            <span className="hidden text-xs text-primary-foreground/70 lg:inline">
              {ROLE_LABELS[profile.role]}
            </span>
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{profile.fullName}</div>
              <div className="text-xs font-normal text-muted-foreground">{profile.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <form action={signOut}>
                <SignOutButton />
              </form>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group/dropdown-menu-item relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
