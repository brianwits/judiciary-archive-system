"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AUDIT_ACTIONS } from "@/types/audit";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/audit?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
      <div className="space-y-2">
        <Label>Action type</Label>
        <Select value={action} onValueChange={(v) => updateParam("action", v ?? "")}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All actions</SelectItem>
            {AUDIT_ACTIONS.map((item) => (
              <SelectItem key={item} value={item}>
                {item.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={() => router.push("/audit")}>
        Clear filters
      </Button>
    </div>
  );
}
