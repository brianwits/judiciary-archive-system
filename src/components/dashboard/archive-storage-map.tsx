import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RoomSummary } from "@/types/archive";

const STATUS_DOT: Record<RoomSummary["status"], string> = {
  available: "bg-success",
  near_full: "bg-warning",
  full: "bg-destructive",
};

const STATUS_BAR: Record<RoomSummary["status"], string> = {
  available: "bg-success",
  near_full: "bg-warning",
  full: "bg-destructive",
};

type ArchiveStorageMapProps = {
  rooms: RoomSummary[];
};

export function ArchiveStorageMap({ rooms }: ArchiveStorageMapProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Archive Storage Map</CardTitle>
          <CardDescription>Physical archive room occupancy</CardDescription>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-warning" /> Near Full
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" /> Full
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link key={room.id} href={`/archive/rooms/${room.id}`}>
              <div className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {room.code}: {room.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{room.category}</p>
                  </div>
                  <span className={cn("size-2.5 rounded-full", STATUS_DOT[room.status])} />
                </div>
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", STATUS_BAR[room.status])}
                    style={{ width: `${room.occupancyPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{room.occupancyPercent}%</span>
                  <span>
                    {room.occupiedCount} files of {room.capacity}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
