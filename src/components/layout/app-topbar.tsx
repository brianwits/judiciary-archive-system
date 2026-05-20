"use client";

import Link from "next/link";
import { Bell, ChevronDown, Menu, Moon, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { MAIN_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { SessionProfile } from "@/lib/auth";
import { ROLE_LABELS, hasPermission } from "@/types/roles";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
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
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppTopbar({ profile }: AppTopbarProps) {
  const pathname = usePathname();
  const [isSigningOut, startSignOut] = useTransition();
  const visibleNav = MAIN_NAV.filter(
    (item) => !item.permission || hasPermission(profile.role, item.permission),
  );

  function handleSignOut() {
    startSignOut(async () => {
      await signOut();
    });
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-sidebar-border bg-primary px-4 text-primary-foreground">
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
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <form action="/cases" method="get" className="mx-auto hidden w-full max-w-xl md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary-foreground/50" />
          <Input
            name="q"
            placeholder="Search files, cases, or registry numbers..."
            className="border-0 bg-white/10 pl-9 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-accent"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-white/10"
          type="button"
        >
          <Moon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-primary-foreground hover:bg-white/10"
          type="button"
        >
          <Bell className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" />
        </Button>

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
            <DropdownMenuItem render={<Link href="/settings" />}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isSigningOut}
              onClick={handleSignOut}
              render={<button type="button" />}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
