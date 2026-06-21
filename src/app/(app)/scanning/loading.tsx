import { TablePanelSkeleton } from "@/components/shared/page-skeletons";

export default function ScanningLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <TablePanelSkeleton rows={4} />
      <TablePanelSkeleton rows={8} />
    </div>
  );
}
