"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuditExportButton() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const href = action ? `/audit/export?action=${encodeURIComponent(action)}` : "/audit/export";

  return (
    <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
      <Download className="size-4" />
      Export CSV
    </Link>
  );
}
