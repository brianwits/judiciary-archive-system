import { ReportCharts } from "@/components/reports/charts";
import { PageHeader } from "@/components/layout/page-header";
import { getReportData } from "@/lib/data";

export default async function ReportsPage() {
  const data = await getReportData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Judiciary archive performance, movement control, and digitization trends"
      />
      <ReportCharts data={data} />
    </div>
  );
}
