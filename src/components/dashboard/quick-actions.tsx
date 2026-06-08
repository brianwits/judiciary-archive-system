import Link from "next/link";
import { Archive, FilePlus, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const cardElevated =
  "border-border/50 shadow-[var(--shadow-premium)] ring-1 ring-border/45 transition-shadow duration-300 hover:shadow-[0_14px_28px_-8px_rgb(0_0_0/0.14)]";

const ACTIONS = [
  {
    label: "Register New Case",
    description: "Create a new case file entry",
    href: "/cases/new",
    icon: FilePlus,
  },
  {
    label: "Track File Movement",
    description: "Checkout or check in files",
    href: "/tracking",
    icon: Truck,
  },
  {
    label: "Browse Archive",
    description: "View storage rooms and locations",
    href: "/archive",
    icon: Archive,
  },
] as const;

export function QuickActions() {
  return (
    <Card className={cn("rounded-2xl", cardElevated)}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common archive operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto w-full justify-start gap-3 px-3 py-3 outline-none ring-offset-background transition-colors hover:border-primary/25 hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:ring-offset-2",
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="text-left">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs font-normal text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
