import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizeArchiveCourtLevel } from "@/lib/archive-family";
import { getArchiveStoredCasesForRoom, getLocationById, getLocationChildren } from "@/lib/data";
import { cn } from "@/lib/utils";

type RoomDetailPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { roomId } = await params;
  const room = await getLocationById(roomId);

  if (!room || room.level !== "room") {
    notFound();
  }

  const [children, storedCases] = await Promise.all([
    getLocationChildren(roomId),
    getArchiveStoredCasesForRoom(roomId, { limit: 80 }),
  ]);
  const occupancyPercent = Math.round((room.occupiedCount / room.capacity) * 100);

  return (
    <div className="space-y-6">
      <Link
        href="/archive"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-2 -ml-2 inline-flex")}
      >
        ← Back to archive
      </Link>

      <PageHeader
        title={`${room.code}: ${room.label}`}
        subtitle={room.category ?? "Archive room"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {room.mappingSource === "generated" ? (
              <Badge variant="secondary">Generated layout</Badge>
            ) : (
              <Badge variant="outline">Verified layout</Badge>
            )}
            <Badge variant="outline">{occupancyPercent}% occupied</Badge>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Capacity</CardDescription>
            <CardTitle className="text-2xl">{room.capacity}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Occupied</CardDescription>
            <CardTitle className="text-2xl">{room.occupiedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available slots</CardDescription>
            <CardTitle className="text-2xl">{room.capacity - room.occupiedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Child locations</CardTitle>
          <CardDescription>Bays, racks, shelves, and boxes within this room</CardDescription>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">No child locations configured.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Occupancy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {children.map((loc) => {
                    const percent = Math.round((loc.occupiedCount / loc.capacity) * 100);
                    return (
                      <TableRow key={loc.id}>
                        <TableCell className="capitalize">{loc.level}</TableCell>
                        <TableCell className="font-mono text-sm">{loc.code}</TableCell>
                        <TableCell>{loc.label}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {loc.occupiedCount} / {loc.capacity} ({percent}%)
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mapped files</CardTitle>
          <CardDescription>
            {storedCases.total.toLocaleString()} case files currently assigned to this room hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {storedCases.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No case files are mapped to this room yet.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Number</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Archive Path</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storedCases.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Link href={`/cases/${item.id}`} className="hover:underline">
                          {item.caseNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{normalizeArchiveCourtLevel(item)}</TableCell>
                      <TableCell>{item.caseTypeFullLabel}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.storagePath ?? item.shelfLocation ?? "—"}
                      </TableCell>
                      <TableCell className="capitalize">{item.status.replace("_", " ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
