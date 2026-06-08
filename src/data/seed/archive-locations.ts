import type { ArchiveLocation, RoomSummary } from "@/types/archive";

export const SEED_LOCATIONS: ArchiveLocation[] = [
  { id: "room-r1", parentId: null, level: "room", code: "R1", label: "Room A - Civil Cases", capacity: 500, occupiedCount: 423, category: "Civil Cases" },
  { id: "room-r2", parentId: null, level: "room", code: "R2", label: "Room B - Criminal Cases", capacity: 400, occupiedCount: 248, category: "Criminal Cases" },
  { id: "room-r3", parentId: null, level: "room", code: "R3", label: "Room C - Family Cases", capacity: 300, occupiedCount: 135, category: "Family Cases" },
  { id: "room-r4", parentId: null, level: "room", code: "R4", label: "Room D - Commercial Cases", capacity: 350, occupiedCount: 319, category: "Commercial Cases" },
  { id: "room-r5", parentId: null, level: "room", code: "R5", label: "Room E - Constitutional", capacity: 200, occupiedCount: 156, category: "Constitutional" },
  { id: "room-r6", parentId: null, level: "room", code: "R6", label: "Room F - Probate & Misc", capacity: 450, occupiedCount: 149, category: "Probate & Misc" },
  { id: "loc-r1-b1", parentId: "room-r1", level: "bay", code: "B1", label: "Bay 1", capacity: 125, occupiedCount: 105 },
  { id: "loc-r1-b2", parentId: "room-r1", level: "bay", code: "B2", label: "Bay 2", capacity: 125, occupiedCount: 108 },
  { id: "loc-r1-b1-r1", parentId: "loc-r1-b1", level: "rack", code: "R1", label: "Rack 1", capacity: 42, occupiedCount: 35 },
  { id: "loc-r1-b2-r3", parentId: "loc-r1-b2", level: "rack", code: "R3", label: "Rack 3", capacity: 42, occupiedCount: 38 },
  { id: "loc-r1-b2-r3-s4", parentId: "loc-r1-b2-r3", level: "shelf", code: "S4", label: "Shelf 4", capacity: 14, occupiedCount: 12 },
  { id: "loc-r2-b1-r2-s3", parentId: "loc-r1-b1-r1", level: "shelf", code: "S3", label: "Shelf 3", capacity: 14, occupiedCount: 10 },
  { id: "loc-r3-b2-r1-s1", parentId: "loc-r1-b2-r3", level: "shelf", code: "S1", label: "Shelf 1", capacity: 14, occupiedCount: 8 },
  { id: "loc-r4-b1-r2-s5", parentId: "loc-r1-b1-r1", level: "shelf", code: "S5", label: "Shelf 5", capacity: 14, occupiedCount: 13 },
  { id: "loc-r5-b2-r3-s2", parentId: "loc-r1-b2-r3", level: "shelf", code: "S2", label: "Shelf 2", capacity: 14, occupiedCount: 11 },
  { id: "loc-r6-b1-r1-s3", parentId: "loc-r1-b1-r1", level: "shelf", code: "S3", label: "Shelf 3", capacity: 14, occupiedCount: 6 },
  { id: "box-r1-b1-r1-s1-b1", parentId: "loc-r1-b2-r3-s4", level: "box", code: "BX1", label: "Box 1", capacity: 50, occupiedCount: 42 },
  { id: "box-r1-b1-r1-s1-b2", parentId: "loc-r1-b2-r3-s4", level: "box", code: "BX2", label: "Box 2", capacity: 50, occupiedCount: 38 },
];

function getOccupancyStatus(percent: number): RoomSummary["status"] {
  if (percent >= 90) return "full";
  if (percent >= 70) return "near_full";
  return "available";
}

export function getRoomSummaries(): RoomSummary[] {
  return SEED_LOCATIONS.filter((l) => l.level === "room").map((room) => {
    const occupancyPercent = Math.round((room.occupiedCount / room.capacity) * 100);
    return {
      id: room.id,
      code: room.code,
      label: room.label,
      category: room.category ?? "",
      capacity: room.capacity,
      occupiedCount: room.occupiedCount,
      occupancyPercent,
      status: getOccupancyStatus(occupancyPercent),
    };
  });
}

export function getLocationChildren(parentId: string | null): ArchiveLocation[] {
  return SEED_LOCATIONS.filter((l) => l.parentId === parentId);
}

export function getLocationById(id: string): ArchiveLocation | undefined {
  return SEED_LOCATIONS.find((l) => l.id === id);
}

/** Builds root › … › leaf codes for mock archive inventory (mirrors hierarchy walk in app). */
export function buildMockArchiveDisplayPath(locationId: string): string {
  const chain: ArchiveLocation[] = [];
  let cur: ArchiveLocation | undefined = getLocationById(locationId);
  while (cur) {
    chain.push(cur);
    cur = cur.parentId ? getLocationById(cur.parentId) : undefined;
  }
  return [...chain].reverse().map((l) => l.code).join(" › ") || "";
}
