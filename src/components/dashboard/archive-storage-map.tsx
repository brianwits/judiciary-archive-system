import { ArrowRight, Building2, FolderKanban, Gavel, MapPin, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { CaseStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildArchiveTypeSections } from "@/lib/archive-family";
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
  variant?: "full" | "dashboard";
};

const cardElevated =
  "border-border/50 shadow-[var(--shadow-premium)] ring-1 ring-border/45 transition-shadow duration-300 hover:shadow-[0_14px_28px_-8px_rgb(0_0_0/0.12)]";

function RoomCapacityOverview({ rooms }: { rooms: RoomSummary[] }) {
  if (rooms.length === 0) return null;

  return (
    <section aria-labelledby="room-capacity-heading">
      <h3 id="room-capacity-heading" className="mb-4 text-sm font-semibold tracking-tight">
        Room capacity overview
      </h3>
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
                  {room.mappingSource === "generated" ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">Generated shelf and box layout</p>
                  ) : null}
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
    </section>
  );
}

export function ArchiveStorageMap({
  rooms,
  storedCases,
  matchingTotal,
  variant = "full",
}: ArchiveStorageMapProps) {
  const inventoryTotal =
    matchingTotal !== undefined ? matchingTotal : storedCases.length;
  const truncated = inventoryTotal > storedCases.length && storedCases.length > 0;
  const sections = buildArchiveTypeSections(storedCases);
  const visibleSections = variant === "dashboard" ? sections.slice(0, 3) : sections;
  const hasGeneratedMapping = storedCases.some((item) => item.locationSource === "generated")
    || rooms.some((room) => room.mappingSource === "generated");

  return (
    <Card className={cn("rounded-2xl", cardElevated)}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Archive Storage</CardTitle>
          <CardDescription>
            Case files on shelves and boxes ({inventoryTotal.toLocaleString()}{" "}
            {inventoryTotal === 1 ? "file" : "files"} mapped to physical archive locations).
          </CardDescription>
          {hasGeneratedMapping ? (
            <div className="mt-3">
              <Badge variant="secondary">Generated room map for operational planning</Badge>
            </div>
          ) : null}
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
        <RoomCapacityOverview rooms={rooms} />

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
          <div className="space-y-8">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {sections.map((section) => (
                <div
                  key={section.key}
                  className="rounded-xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{section.label}</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight">{section.count.toLocaleString()}</p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-background/70">
                      <FolderKanban className="size-4 text-primary" aria-hidden />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {section.groups.length.toLocaleString()}{" "}
                      {section.groups.length === 1 ? "case type" : "case types"}
                    </span>
                    {section.storagePaths.length > 0 ? (
                      <span>{section.storagePaths.slice(0, 2).join(" · ")}</span>
                    ) : (
                      <span>Shelf mapping pending</span>
                    )}
                    {section.missingCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <ShieldAlert className="size-3" aria-hidden />
                        {section.missingCount} missing
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {visibleSections.map((section) => {
              return (
                <section key={section.key} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold tracking-tight">{section.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {section.count.toLocaleString()} {section.count === 1 ? "file" : "files"}
                        {section.storagePaths.length > 0
                          ? ` · ${section.storagePaths.slice(0, variant === "dashboard" ? 1 : 2).join(" · ")}`
                          : " · Shelf mapping pending"}
                      </p>
                    </div>
                    {variant === "dashboard" && section.groups.length > 2 ? (
                      <Link href="/archive" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                        View all <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    ) : null}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {section.groups
                      .slice(0, variant === "dashboard" ? 2 : undefined)
                      .map((group) => {
                        const cases = variant === "dashboard" ? group.cases.slice(0, 2) : group.cases;

                        return (
                          <div key={group.key} className="rounded-2xl border border-border/60 bg-card/80 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-semibold tracking-tight">{group.label}</h4>
                                  <Badge variant="outline">{section.label}</Badge>
                                  {group.code ? (
                                    <Badge variant="secondary" className="font-mono text-[11px]">
                                      {group.code}
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {group.count.toLocaleString()} {group.count === 1 ? "file" : "files"}
                                  {group.storagePaths.length > 0
                                    ? ` · ${group.storagePaths.slice(0, 2).join(" · ")}`
                                    : " · Shelf mapping pending"}
                                </p>
                              </div>
                              {group.missingCount > 0 ? (
                                <Badge variant="destructive">{group.missingCount} missing</Badge>
                              ) : null}
                            </div>

                            <div className="mt-4 grid gap-3">
                              {cases.map((row) => (
                                <Link
                                  key={row.id}
                                  href={`/cases/${row.id}`}
                                  className="group block rounded-xl outline-none ring-offset-background focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
                                >
                                  <article className="flex h-full flex-col rounded-xl border border-border/60 bg-background p-4 text-left transition-[box-shadow,border-color] group-hover:border-primary/20 group-hover:shadow-md group-focus-visible:border-primary/30 group-focus-visible:shadow-md">
                                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{row.caseNumber}</p>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.title}</p>
                                        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                          <span>{row.caseTypeFullLabel}</span>
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
                          </div>
                        );
                      })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
