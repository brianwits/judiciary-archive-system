"use client";

import { Download, Trash2, X } from "lucide-react";
import { CASE_STATUSES, type CaseStatus } from "@/types/case";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CasesBulkToolbarProps = {
  count: number;
  canEdit: boolean;
  canDelete: boolean;
  onStatusChange: (status: CaseStatus) => void;
  onExport: () => void;
  onDelete: () => void;
  onClear: () => void;
};

export function CasesBulkToolbar({
  count,
  canEdit,
  canDelete,
  onStatusChange,
  onExport,
  onDelete,
  onClear,
}: CasesBulkToolbarProps) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <span className="text-sm font-medium">
        {count} selected
      </span>

      {canEdit ? (
        <Select onValueChange={(value) => value && onStatusChange(value as CaseStatus)}>
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue placeholder="Set status..." />
          </SelectTrigger>
          <SelectContent>
            {CASE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onExport}>
        <Download className="size-4" />
        Export CSV
      </Button>

      {canDelete ? (
        <Button type="button" variant="destructive" size="sm" className="gap-2" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </Button>
      ) : null}

      <Button type="button" variant="ghost" size="sm" className="ml-auto gap-2" onClick={onClear}>
        <X className="size-4" />
        Clear
      </Button>
    </div>
  );
}
