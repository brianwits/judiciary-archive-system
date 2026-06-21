export type CourtStationSeed = {
  code: string;
  name: string;
  county: string;
  courtRank: string;
};

export const COURT_STATION_SEEDS: CourtStationSeed[] = [
  { code: "KBT", name: "Kibera", county: "Nairobi", courtRank: "High Court Registry" },
  { code: "NRB", name: "Nairobi", county: "Nairobi", courtRank: "High Court Registry" },
  { code: "MSA", name: "Mombasa", county: "Mombasa", courtRank: "Magistrates Registry" },
  { code: "KSM", name: "Kisumu", county: "Kisumu", courtRank: "Magistrates Registry" },
  { code: "NKR", name: "Nakuru", county: "Nakuru", courtRank: "Magistrates Registry" },
];

