/**
 * Source directories for Kabarnet CTS case data CSV files.
 *
 * Override via the CSV_SOURCE_DIR environment variable:
 *   export CSV_SOURCE_DIR="/path/to/your/csv/files"
 *
 * If CSV_SOURCE_DIR is not set, falls back to the hardcoded WSL paths
 * (specific to the original development machine).
 *
 * Only used in mock/development mode (isMockDataEnabled() === true).
 */
export interface CsvSourceConfig {
  path: string;
}

function getSourceDirs(): CsvSourceConfig[] {
  const envOverride = typeof process !== "undefined" ? process.env.CSV_SOURCE_DIR : undefined;

  if (envOverride && envOverride.trim().length > 0) {
    return [{ path: envOverride.trim() }];
  }

  return [
    {
      path: "/mnt/c/Users/User/OneDrive - The Judiciary of Kenya/Documents/Playground/cts-kabarnet-closed-cases-subsets",
    },
    {
      path: "/mnt/c/Users/User/OneDrive - The Judiciary of Kenya/Documents/Playground/cts-kabarnet-highcourt-closed-cases-subsets",
    },
  ];
}

export const CSV_SOURCE_DIRS: CsvSourceConfig[] = getSourceDirs();


