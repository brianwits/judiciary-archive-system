import { ArrowRight, Building2, Gavel, MapPin } from "lucide-react";
import Link from "next/link";
import { CaseStatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ArchiveStoredCase, RoomSummary } from "@/types/archive";

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
  storedCases: ArchiveStoredCase[];
  /** Rows returned by inventory query matching `storedCases.length` when capped. */
  matchingTotal?: number;
};

const cardElevated =
  "border-border/50 shadow-[var(--shadow-premium)] ring-1 ring-border/45 transition-shadow duration-300 hover:shadow-[0_14px_28px_-8px_rgb(0_0_0/0.12)]";

export function ArchiveStorageMap({ rooms, storedCases, matchingTotal }: ArchiveStorageMapProps) {
  const inventoryTotal =
    matchingTotal !== undefined ? matchingTotal : storedCases.length;
  const truncated = inventoryTotal > storedCases.length && storedCases.length > 0;

  return (
    <Card className={cn("rounded-2xl", cardElevated)}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Archive Storage</CardTitle>
          <CardDescription>
            Case files on shelves and boxes ({inventoryTotal.toLocaleString()}{" "}
            {inventoryTotal === 1 ? "file" : "files"} mapped to physical archive locations).
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> Available rooms
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-warning" /> Near full
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-destructive" /> Full
            </span>
          </div>
          {truncated ? (
            <Link href="/archive" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View complete inventory <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-10">
        {storedCases.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
            <Building2 className="size-9 text-muted-foreground" aria-hidden />
            <p className="max-w-md text-sm text-muted-foreground">
              No case files are mapped to archive locations yet. Assign a shelf, box, or room to a case
              to show it here, or browse rooms for capacity planning.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/cases" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                Open cases
              </Link>
              {rooms.length > 0 ? (
                <Link
                  href={`/archive/rooms/${rooms[0].id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Browse archive tree
                </Link>
              ) : (
                <Link href="/archive" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Browse archive
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {storedCases.map((row) => (
              <Link
                key={row.id}
                href={`/cases/${row.id}`}
                className="group block rounded-xl outline-none ring-offset-background focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
              >
                <article className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-4 text-left transition-[box-shadow,border-color] group-hover:border-primary/20 group-hover:shadow-md group-focus-visible:border-primary/30 group-focus-visible:shadow-md">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{row.caseNumber}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.title}</p>
                      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        <span>{row.caseType}</span>
                        <span aria-hidden className="text-border">
                          •
                        </span>
                        <span>{row.courtStation}</span>
                        <span aria-hidden className="text-border">
                          •
                        </span>
                        <span>{row.year ?? "—"}</span>
                      </div>
                    </div>
                    <CaseStatusBadge status={row.status} />
                  </div>
                  {row.storagePath ? (
                    <div className="mb-3 flex gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-snug">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                      <span className="text-foreground/90">{row.storagePath}</span>
                    </div>
                  ) : row.shelfLocation ? (
                    <div className="mb-3 flex gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-snug">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                      <span className="font-mono text-foreground/90">{row.shelfLocation}</span>
                    </div>
                  ) : null}
                  {(row.archiveCode || row.judge) ? (
                    <div className="mt-auto flex flex-wrap items-start gap-x-3 gap-y-1 border-t border-border/45 pt-3 text-xs text-muted-foreground">
                      {row.archiveCode ? (
                        <span>
                          Archive ref: <span className="font-medium text-foreground">{row.archiveCode}</span>
                        </span>
                      ) : null}
                      {row.judge ? (
                        <span className="inline-flex items-start gap-1">
                          <Gavel className="mt-px size-3 shrink-0" aria-hidden />
                          <span className="text-foreground/85">{row.judge}</span>
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              </Link>
            ))}
          </div>
        )}

        {rooms.length > 0 ? (
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-tight">Room capacity overview</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/archive/rooms/${room.id}`}
                  className="group block rounded-xl outline-none ring-offset-background focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
                >
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 transition-[box-shadow,border-color] group-hover:border-primary/25 group-hover:bg-muted/35 group-hover:shadow-sm group-focus-visible:border-primary/30">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {room.code}: {room.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{room.category}</p>
                      </div>
                      <span
                        className={cn("size-2.5 shrink-0 rounded-full", STATUS_DOT[room.status])}
                        title={room.status.replace("_", " ")}
                        aria-hidden
                      />
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={room.occupancyPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${room.code} occupancy ${room.occupancyPercent} percent, ${room.occupiedCount} of ${room.capacity} files`}
                      className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className={cn("h-full rounded-full transition-all", STATUS_BAR[room.status])}
                        style={{ width: `${room.occupancyPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span aria-hidden>{room.occupancyPercent}%</span>
                      <span>
                        {room.occupiedCount} files of {room.capacity}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
