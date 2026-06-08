import { Suspense } from "react";
import { AuditExportButton } from "@/components/audit/audit-export-button";
import { AuditFilters } from "@/components/audit/audit-filters";
import { AuditTable } from "@/components/audit/audit-table";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/contracts/queries";
import { getAuditLogs } from "@/lib/data";
import type { AuditAction } from "@/types/audit";

type AuditPageProps = {
  searchParams: Promise<{ action?: string; page?: string }>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const page = Math.max(Number(params.page) || DEFAULT_PAGE, 1);
  const action = params.action as AuditAction | undefined;

  const logs = await getAuditLogs(
    { page, pageSize: DEFAULT_PAGE_SIZE },
    action ? { action } : undefined,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable record of system actions and file operations"
        actions={
          <Suspense fallback={<Skeleton className="h-9 w-28" />}>
            <AuditExportButton />
          </Suspense>
        }
      />

      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <AuditFilters />
      </Suspense>

      <AuditTable logs={logs} />
    </div>
  );
}
