import { Suspense } from "react";
import { ArchiveStorageMap } from "@/components/dashboard/archive-storage-map";
import { PageHeader } from "@/components/layout/page-header";
import { ChartPanelSkeleton } from "@/components/shared/page-skeletons";
import { getArchiveStoredCases, getRoomSummaries } from "@/lib/data";

export default async function ArchivePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Archive Storage"
        subtitle="Stored case inventory with hierarchy paths plus room occupancy"
      />
      <Suspense fallback={<ChartPanelSkeleton tall />}>
        <ArchivePageContent />
      </Suspense>
    </div>
  );
}

async function ArchivePageContent() {
  const [rooms, archiveInventory] = await Promise.all([
    getRoomSummaries(),
    getArchiveStoredCases({ limit: 500 }),
  ]);

  return (
    <ArchiveStorageMap
      rooms={rooms}
      storedCases={archiveInventory.items}
      matchingTotal={archiveInventory.total}
      from="archive"
    />
  );
}
