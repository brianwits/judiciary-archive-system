"use client";

import { ChevronDown, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { signOut } from "@/app/actions/auth";
import { AlertsMenu } from "@/components/layout/alerts-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSidebar } from "@/components/layout/sidebar-provider";
import type { Alert } from "@/types/dashboard";
import type { SessionProfile } from "@/lib/auth";
import { ROLE_LABELS } from "@/types/roles";
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

type AppTopbarProps = {
  profile: SessionProfile;
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

export function AppTopbar({ profile, alerts }: AppTopbarProps) {
  const router = useRouter();
  const { toggleMobile } = useSidebar();

  return (
    <header className="flex h-15 shrink-0 items-center gap-4 border-b border-sidebar-border/80 bg-gradient-to-r from-primary to-primary/92 px-4 text-primary-foreground shadow-sm backdrop-blur-sm print:hidden">
      {/* Mobile hamburger controls the sidebar overlay. */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobile}
        className="md:hidden text-primary-foreground hover:bg-white/10"
        aria-label="Toggle navigation sidebar"
      >
        <Menu className="size-5" />
      </Button>

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
