export const LOCATION_LEVELS = ["room", "bay", "rack", "shelf", "box"] as const;
export type LocationLevel = (typeof LOCATION_LEVELS)[number];

export type ArchiveLocation = {
  id: string;
  parentId: string | null;
  level: LocationLevel;
  code: string;
  label: string;
  capacity: number;
  occupiedCount: number;
  category?: string;
};

export type RoomSummary = {
  id: string;
  code: string;
  label: string;
  category: string;
  capacity: number;
  occupiedCount: number;
  occupancyPercent: number;
  status: "available" | "near_full" | "full";
};
