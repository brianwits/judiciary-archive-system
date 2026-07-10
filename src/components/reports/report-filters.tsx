"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CASE_TYPE_DEFINITIONS } from "@/data/case-types";

export function ReportFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-6 xl:items-end">
      <div className="space-y-2">
        <Label htmlFor="report-from">From</Label>
        <Input id="report-from" type="date" value={searchParams.get("from") ?? ""} onChange={(event) => update("from", event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="report-to">To</Label>
        <Input id="report-to" type="date" value={searchParams.get("to") ?? ""} onChange={(event) => update("to", event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Court level</Label>
        <Select value={searchParams.get("courtLevel") ?? ""} onValueChange={(value) => update("courtLevel", value ?? "")}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All courts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All courts</SelectItem>
            <SelectItem value="High Court">High Court</SelectItem>
            <SelectItem value="Magistrate Court">Magistrate Court</SelectItem>
            <SelectItem value="Environment and Land Court">Environment &amp; Land Court</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Case type</Label>
        <Select value={searchParams.get("caseTypeId") ?? ""} onValueChange={(value) => update("caseTypeId", value ?? "")}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {CASE_TYPE_DEFINITIONS.map((definition) => (
              <SelectItem key={definition.caseTypeId} value={String(definition.caseTypeId)}>{definition.caseType}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={() => router.push("/reports")}>Reset filters</Button>
    </div>
  );
}
