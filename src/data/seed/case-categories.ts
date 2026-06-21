import research from "../../../docs/kenya-judiciary-case-categories-research.json";

export type ResearchCaseCategory = {
  court_level: string;
  division: string;
  case_category_name: string;
  common_prefix: string;
  alternative_prefixes: string[];
  example_case_number: string;
  example_reference: string;
  source_url: string;
  description: string;
  suggested_system_code: string;
  parent_category: string;
  archive_indexing_notes: string;
  confidence_level: string;
  requires_registry_verification: boolean;
  notes: string;
};

export const CASE_CATEGORY_DEFINITIONS = research.case_categories as ResearchCaseCategory[];

const APP_CRITICAL_CASE_CATEGORIES: ResearchCaseCategory[] = [
  {
    court_level: "High Court",
    division: "Family",
    case_category_name: "High Court Family Case",
    common_prefix: "FAM",
    alternative_prefixes: ["Family Case", "HFAM"],
    example_case_number: "FAM/089/2025",
    example_reference: "Current app family matter",
    source_url: "https://highcourt.judiciary.go.ke/court-registry/",
    description: "Family matter before the High Court.",
    suggested_system_code: "HC_FAMILY",
    parent_category: "Family",
    archive_indexing_notes: "Index by parties, child references, maintenance orders, and registry.",
    confidence_level: "High",
    requires_registry_verification: false,
    notes: "App-critical canonical family category.",
  },
  {
    court_level: "High Court",
    division: "Commercial",
    case_category_name: "High Court Commercial Case",
    common_prefix: "COM",
    alternative_prefixes: ["Commercial Case", "HCCOM"],
    example_case_number: "COM/234/2024",
    example_reference: "Current app commercial matter",
    source_url: "https://highcourt.judiciary.go.ke/court-registry/",
    description: "Commercial matter before the High Court.",
    suggested_system_code: "HC_COMMERCIAL",
    parent_category: "Commercial",
    archive_indexing_notes: "Index by parties, claim amount, subject matter, and registry.",
    confidence_level: "High",
    requires_registry_verification: false,
    notes: "App-critical canonical commercial category.",
  },
  {
    court_level: "High Court",
    division: "Constitutional",
    case_category_name: "High Court Constitutional Case",
    common_prefix: "CON",
    alternative_prefixes: ["Constitutional Case", "HCCON"],
    example_case_number: "CON/012/2025",
    example_reference: "Current app constitutional matter",
    source_url: "https://highcourt.judiciary.go.ke/court-registry/",
    description: "Constitutional matter before the High Court.",
    suggested_system_code: "HC_CONSTITUTIONAL",
    parent_category: "Constitutional",
    archive_indexing_notes: "Index by constitutional issue, parties, and registry.",
    confidence_level: "High",
    requires_registry_verification: false,
    notes: "App-critical canonical constitutional category.",
  },
  {
    court_level: "High Court",
    division: "Probate / Succession",
    case_category_name: "High Court Probate Cause",
    common_prefix: "PRO",
    alternative_prefixes: ["Probate Cause", "Succession Cause", "HC Succession"],
    example_case_number: "PRO/078/2022",
    example_reference: "Current app probate matter",
    source_url: "https://efiling.court.go.ke/auth/probate_matters",
    description: "Probate and succession matter before the High Court.",
    suggested_system_code: "HC_PROBATE",
    parent_category: "Probate",
    archive_indexing_notes: "Index by deceased, personal representative, grant status, and assets.",
    confidence_level: "High",
    requires_registry_verification: false,
    notes: "App-critical canonical probate category.",
  },
];

export const ALL_CASE_CATEGORY_DEFINITIONS = [
  ...CASE_CATEGORY_DEFINITIONS,
  ...APP_CRITICAL_CASE_CATEGORIES,
] as const;

export type CaseCategoryDefinition = ResearchCaseCategory;

export const CASE_CATEGORY_CODES = ALL_CASE_CATEGORY_DEFINITIONS.map(
  (category) => category.suggested_system_code,
);

export const CASE_CATEGORY_FAMILIES = [
  "Civil",
  "Criminal",
  "ELC",
  "Family",
  "Commercial",
  "Constitutional",
  "Probate",
  "Traffic",
  "Succession",
] as const;
