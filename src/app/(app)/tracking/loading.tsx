import { TablePanelSkeleton } from "@/components/shared/page-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <TablePanelSkeleton rows={4} />
        <TablePanelSkeleton rows={4} />
      </div>
      <TablePanelSkeleton rows={7} />
    </div>
  );
}
