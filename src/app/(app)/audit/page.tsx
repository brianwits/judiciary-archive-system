import { AuditTable } from "@/components/audit/audit-table";
import { PageHeader } from "@/components/layout/page-header";
import { getAuditLogs } from "@/lib/data";

export default async function AuditPage() {
  const logs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable record of system actions and file operations"
      />
      <AuditTable logs={logs} />
    </div>
  );
}
