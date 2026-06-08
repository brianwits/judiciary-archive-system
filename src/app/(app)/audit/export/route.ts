import { format } from "date-fns";
import { NextResponse } from "next/server";
import { canViewAudit, getSessionProfile } from "@/lib/auth";
import { getAuditLogsForExport } from "@/lib/data";
import { auditLogsToCsv } from "@/lib/export/csv";
import { AUDIT_ACTIONS, type AuditAction } from "@/types/audit";

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !canViewAudit(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const actionParam = searchParams.get("action");
  const action =
    actionParam && AUDIT_ACTIONS.includes(actionParam as AuditAction)
      ? (actionParam as AuditAction)
      : undefined;

  const { logs, truncated } = await getAuditLogsForExport(action ? { action } : undefined);
  const csv = auditLogsToCsv(logs, truncated);
  const dateStamp = format(new Date(), "yyyy-MM-dd");
  const suffix = action ? `-${action}` : "";
  const filename = `audit-logs${suffix}-${dateStamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
