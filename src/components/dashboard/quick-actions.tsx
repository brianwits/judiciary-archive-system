import Link from "next/link";
import { Archive, FilePlus, ScanLine, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    label: "Scan Documents",
    description: "Upload digital case documents",
    href: "/scanning",
    icon: ScanLine,
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
    <Card className="shadow-sm">
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
                "h-auto w-full justify-start gap-3 px-3 py-3",
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
