import { ReportCharts } from "@/components/reports/charts";
import { PageHeader } from "@/components/layout/page-header";
import { getReportData } from "@/lib/data";

export default async function ReportsPage() {
  const data = await getReportData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Archive performance, movements, and scanning metrics"
      />
      <ReportCharts data={data} />
    </div>
  );
}
