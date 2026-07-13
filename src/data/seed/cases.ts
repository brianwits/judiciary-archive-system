import type { CaseFile } from "@/types/case";
import { loadCasesFromCsv } from "@/lib/data/csv-loader";

const csvData = loadCasesFromCsv();

export const SEED_CASES: CaseFile[] = csvData.cases;

export const SEED_CASE_NUMBER_ALIASES: { caseId: string; caseNumber: string }[] = [];


