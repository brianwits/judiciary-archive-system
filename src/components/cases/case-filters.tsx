"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CASE_STATUSES } from "@/types/case";
import { CASE_TYPE_DEFINITIONS } from "@/data/case-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

export function CaseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const caseTypeId = searchParams.get("caseTypeId") ?? "";
  const classification = searchParams.get("classification") ?? "";
  const year = searchParams.get("year") ?? "";
  const status = searchParams.get("status") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/cases?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/cases");
  }

  return (
    <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-end">
      <div className="space-y-2">
        <Label>Case type</Label>
        <Select value={caseTypeId} onValueChange={(v) => updateParam("caseTypeId", v ?? "")}>
          <SelectTrigger className="w-full xl:w-[340px]">
            <SelectValue placeholder="All case types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All case types</SelectItem>
            {CASE_TYPE_DEFINITIONS.map((definition) => (
              <SelectItem key={definition.caseTypeId} value={String(definition.caseTypeId)}>
                {definition.caseType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Classification</Label>
        <Select value={classification} onValueChange={(v) => updateParam("classification", v ?? "")}>
          <SelectTrigger className="w-full xl:w-[170px]">
            <SelectValue placeholder="All records" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All records</SelectItem>
            <SelectItem value="canonical">Canonical</SelectItem>
            <SelectItem value="legacy">Legacy</SelectItem>
            <SelectItem value="pending_review">Pending review</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Year</Label>
        <Select value={year} onValueChange={(v) => updateParam("year", v ?? "")}>
          <SelectTrigger className="w-full xl:w-[120px]">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All years</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => updateParam("status", v ?? "")}>
          <SelectTrigger className="w-full xl:w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {CASE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={clearFilters}>
        Clear filters
      </Button>
    </div>
  );
}
