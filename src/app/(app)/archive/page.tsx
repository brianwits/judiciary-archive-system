import { ArchiveStorageMap } from "@/components/dashboard/archive-storage-map";
import { PageHeader } from "@/components/layout/page-header";
import { getRoomSummaries } from "@/lib/data";

export default async function ArchivePage() {
  const rooms = await getRoomSummaries();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Archive Storage"
        subtitle="Physical archive rooms and occupancy overview"
      />
      <ArchiveStorageMap rooms={rooms} />
    </div>
  );
}
