/**
 * Source directories for Kabarnet CTS case data CSV files.
 * Each config provides a path and the associated court division.
 * Only used in mock/development mode (isMockDataEnabled() === true).
 */
export interface CsvSourceConfig {
  path: string;
}

export const CSV_SOURCE_DIRS: CsvSourceConfig[] = [
  {
    path: "/mnt/c/Users/User/OneDrive - The Judiciary of Kenya/Documents/Playground/cts-kabarnet-closed-cases-subsets",
  },
  {
    path: "/mnt/c/Users/User/OneDrive - The Judiciary of Kenya/Documents/Playground/cts-kabarnet-highcourt-closed-cases-subsets",
  },
];


