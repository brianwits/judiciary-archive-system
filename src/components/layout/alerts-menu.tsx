"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Alert } from "@/types/dashboard";

type AlertsMenuProps = {
  alerts: Alert[];
  className?: string;
};

export function AlertsMenu({ alerts, className }: AlertsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className={cn("relative text-primary-foreground hover:bg-white/10", className)}
          />
        }
      >
        <Bell className="size-4" />
        {alerts.length > 0 && (
          <span className="absolute right-1.5 top-1.5 size-2 animate-pulse rounded-full bg-accent" />
        )}
        <span className="sr-only">Open alerts</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Operational alerts</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <DropdownMenuItem disabled>No active alerts</DropdownMenuItem>
        ) : (
          <DropdownMenuGroup>
            {alerts.map((alert) => (
              <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1 py-2">
                <span className="font-medium">{alert.title}</span>
                <span className="text-xs text-muted-foreground">{alert.message}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLinkItem render={<Link href="/tracking" />}>View file tracking</DropdownMenuLinkItem>
        <DropdownMenuLinkItem render={<Link href="/" />}>Open dashboard</DropdownMenuLinkItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
