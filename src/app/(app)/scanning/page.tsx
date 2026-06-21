import { ScanningConsole } from "@/components/scanning/scanning-console";
import { PageHeader } from "@/components/layout/page-header";

export default function ScanningPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Scanning"
        subtitle="Capture and archive digital documents against the correct case file"
      />
      <ScanningConsole />
    </div>
  );
}
