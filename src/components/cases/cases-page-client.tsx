"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkDeleteCases, bulkUpdateCaseStatus } from "@/app/actions/cases";
import { CasesBulkToolbar } from "@/components/cases/cases-bulk-toolbar";
import { CasesDataTable } from "@/components/cases/cases-data-table";
import { casesToCsvRows } from "@/lib/export/csv";
import type { CaseFile } from "@/types/case";
import type { UserRole } from "@/types/roles";
import { canEditCases, isAdmin } from "@/types/roles";

type CasesPageClientProps = {
  cases: CaseFile[];
  docCountByCaseId: Record<string, number>;
  role: UserRole;
};

export function CasesPageClient({ cases, docCountByCaseId, role }: CasesPageClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCases = useMemo(
    () => cases.filter((item) => selectedIds.includes(item.id)),
    [cases, selectedIds],
  );

  const canEdit = canEditCases(role);
  const canDelete = isAdmin(role);

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    );
  }

  function toggleAll(checked: boolean) {
    const pageIds = cases.map((item) => item.id);
    const pageIdSet = new Set(pageIds);
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, ...pageIds])]
        : current.filter((id) => !pageIdSet.has(id)),
    );
  }

  async function handleStatusChange(status: CaseFile["status"]) {
    const result = await bulkUpdateCaseStatus(selectedIds, status);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    const { updated, failed } = result.data;
    if (failed.length > 0) {
      toast.warning(`Updated ${updated} case(s). ${failed.length} failed.`);
    } else {
      toast.success(`Updated ${updated} case(s).`);
    }
    setSelectedIds([]);
    router.refresh();
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete ${selectedIds.length} selected case file(s)? This cannot be undone.`,
      )
    ) {
      return;
    }

    const result = await bulkDeleteCases(selectedIds);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    const { deleted, failed } = result.data;
    if (failed.length > 0) {
      toast.warning(`Deleted ${deleted} case(s). ${failed.length} failed.`);
    } else {
      toast.success(`Deleted ${deleted} case(s).`);
    }
    setSelectedIds([]);
    router.refresh();
  }

  function handleExportCsv() {
    const csv = casesToCsvRows(selectedCases);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cases-export-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedCases.length} case(s).`);
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 ? (
        <CasesBulkToolbar
          count={selectedIds.length}
          canEdit={canEdit}
          canDelete={canDelete}
          onStatusChange={handleStatusChange}
          onExport={handleExportCsv}
          onDelete={handleDelete}
          onClear={() => setSelectedIds([])}
        />
      ) : null}

      <CasesDataTable
        cases={cases}
        docCountByCaseId={docCountByCaseId}
        selectedIds={selectedIds}
        onToggleOne={toggleOne}
        onToggleAll={toggleAll}
      />
    </div>
  );
}
