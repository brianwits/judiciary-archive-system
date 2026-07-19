import type { ArchiveLocation, RoomSummary } from "@/types/archive";

const ROOM_DEFINITIONS = [
  { code: "R1", label: "Room A - Civil Cases", category: "Civil Cases" },
  { code: "R2", label: "Room B - Criminal Cases", category: "Criminal Cases" },
  { code: "R3", label: "Room C - Succession Cases", category: "Succession Cases" },
  { code: "R4", label: "Room D - Commercial Cases", category: "Commercial Cases" },
  { code: "R5", label: "Room E - Constitutional Cases", category: "Constitutional Cases" },
  { code: "R6", label: "Room F - Probate Cases", category: "Probate Cases" },
  { code: "R7", label: "Room G - ELC Cases", category: "ELC Cases" },
  { code: "R8", label: "Room H - Traffic Cases", category: "Traffic Cases" },
  { code: "R9", label: "Room I - Other Cases", category: "Other Cases" },
] as const;

function createLocation(
  id: string,
  parentId: string | null,
  level: ArchiveLocation["level"],
  code: string,
  label: string,
  capacity: number,
  category?: string,
): ArchiveLocation {
  return {
    id,
    parentId,
    level,
    code,
    label,
    capacity,
    occupiedCount: 0,
    category,
    active: true,
    mappingSource: "generated",
  };
}

export const SEED_LOCATIONS: ArchiveLocation[] = ROOM_DEFINITIONS.flatMap((room) => {
  const roomId = `room-${room.code.toLowerCase()}`;
  const locations: ArchiveLocation[] = [
    createLocation(roomId, null, "room", room.code, room.label, 6000, room.category),
  ];

  for (let bayIndex = 1; bayIndex <= 2; bayIndex += 1) {
    const bayId = `${roomId}-b${bayIndex}`;
    locations.push(createLocation(bayId, roomId, "bay", `B${bayIndex}`, `Bay ${bayIndex}`, 3000, room.category));

    for (let rackIndex = 1; rackIndex <= 3; rackIndex += 1) {
      const rackId = `${bayId}-rk${rackIndex}`;
      locations.push(createLocation(rackId, bayId, "rack", `RK${rackIndex}`, `Rack ${rackIndex}`, 1000, room.category));

      for (let shelfIndex = 1; shelfIndex <= 4; shelfIndex += 1) {
        const shelfId = `${rackId}-s${shelfIndex}`;
        locations.push(
          createLocation(shelfId, rackId, "shelf", `S${shelfIndex}`, `Shelf ${shelfIndex}`, 250, room.category),
        );

        for (let boxIndex = 1; boxIndex <= 5; boxIndex += 1) {
          const boxId = `${shelfId}-bx${boxIndex}`;
          locations.push(
            createLocation(boxId, shelfId, "box", `BX${boxIndex}`, `Box ${boxIndex}`, 50, room.category),
          );
        }
      }
    }
  }

  return locations;
});

function getOccupancyStatus(percent: number): RoomSummary["status"] {
  if (percent >= 90) return "full";
  if (percent >= 70) return "near_full";
  return "available";
}

export function getRoomSummaries(): RoomSummary[] {
  return SEED_LOCATIONS.filter((location) => location.level === "room").map((room) => {
    const occupancyPercent = room.capacity > 0 ? Math.round((room.occupiedCount / room.capacity) * 100) : 0;
    return {
      id: room.id,
      code: room.code,
      label: room.label,
      category: room.category ?? "",
      capacity: room.capacity,
      occupiedCount: room.occupiedCount,
      occupancyPercent,
      status: getOccupancyStatus(occupancyPercent),
      mappingSource: room.mappingSource,
    };
  });
}

export function getLocationChildren(parentId: string | null): ArchiveLocation[] {
  return SEED_LOCATIONS.filter((location) => location.parentId === parentId);
}

export function getLocationById(id: string): ArchiveLocation | undefined {
  return SEED_LOCATIONS.find((location) => location.id === id);
}

/** Builds root › … › leaf codes for mock archive inventory (mirrors hierarchy walk in app). */
export function buildMockArchiveDisplayPath(locationId: string): string {
  const chain: ArchiveLocation[] = [];
  let current: ArchiveLocation | undefined = getLocationById(locationId);
  while (current) {
    chain.push(current);
    current = current.parentId ? getLocationById(current.parentId) : undefined;
  }
  return [...chain].reverse().map((location) => location.code).join(" › ") || "";
}
