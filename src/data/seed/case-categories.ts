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
  // ── Children & Protection (Magistrate Court) ───────────────────────────
  {
    court_level: "Magistrates Court",
    division: "Children / Family",
    case_category_name: "Magistrate Children's Protection Case",
    common_prefix: "MCPC",
    alternative_prefixes: ["MCPC", "MC Children", "Children Matter"],
    example_case_number: "MCPC/001/2026",
    example_reference: "Children's protection matter at Magistrate level",
    source_url: "https://judiciary.go.ke/",
    description: "Children's protection or maintenance matter in a Magistrate's Court.",
    suggested_system_code: "MC_CHILDREN_PROTECTION",
    parent_category: "Children & Protection",
    archive_indexing_notes: "Protect minor identities and support confidentiality flags.",
    confidence_level: "Medium",
    requires_registry_verification: true,
    notes: "Separate from Family division; handled in children-specific registry.",
  },
  // ── Employment & Labour (Magistrate Court & ELRC) ──────────────────────
  {
    court_level: "Magistrates Court",
    division: "Employment and Labour Relations",
    case_category_name: "Magistrate Employment and Labour Case",
    common_prefix: "MCEMP",
    alternative_prefixes: ["MC Labour", "MC Employment", "MCEML"],
    example_case_number: "MCEMP/001/2026",
    example_reference: "Employment matter at Magistrate level",
    source_url: "https://new.kenyalaw.org/causelists/KEELRC/",
    description: "Employment and labour relations matter at Magistrate level.",
    suggested_system_code: "MC_EMPLOYMENT",
    parent_category: "Employment & Labour",
    archive_indexing_notes: "Index by claimant, respondent, division, station, and hearing date.",
    confidence_level: "High",
    requires_registry_verification: false,
    notes: "MCELRC prefix observed in public cause lists.",
  },
  // ── Anti-Corruption & Economic Crimes (Magistrate Court) ───────────────
  {
    court_level: "Magistrates Court",
    division: "Anti-Corruption",
    case_category_name: "Magistrate Anti-Corruption Case",
    common_prefix: "MCAC",
    alternative_prefixes: ["MC Anti-Corruption", "MC Corruption"],
    example_case_number: "MCAC/001/2026",
    example_reference: "Anti-corruption matter at Magistrate level",
    source_url: "https://judiciary.go.ke/",
    description: "Anti-corruption and economic crimes matter before the Magistrate's Court.",
    suggested_system_code: "MC_ANTI_CORRUPTION",
    parent_category: "Anti-Corruption & Economic Crimes",
    archive_indexing_notes: "Index by accused, offence type, investigating agency, and year.",
    confidence_level: "Medium",
    requires_registry_verification: true,
    notes: "Specialised court within the Magistrate structure.",
  },
  // ── Election (Magistrate Court) ────────────────────────────────────────
  {
    court_level: "Magistrates Court",
    division: "Election",
    case_category_name: "Magistrate Election Offence Case",
    common_prefix: "MCEO",
    alternative_prefixes: ["MC Election", "MC Election Offence"],
    example_case_number: "MCEO/001/2026",
    example_reference: "Election offence at Magistrate level",
    source_url: "https://judiciary.go.ke/",
    description: "Election offence matter before the Magistrate's Court.",
    suggested_system_code: "MC_ELECTION",
    parent_category: "Election",
    archive_indexing_notes: "Index by constituency, election cycle, offence, and outcome.",
    confidence_level: "Medium",
    requires_registry_verification: true,
    notes: "Lower-level election offences handled at Magistrate level.",
  },
  // ── Judicial Review (High Court) ──────────────────────────────────────
  {
    court_level: "High Court",
    division: "Judicial Review",
    case_category_name: "High Court Judicial Review Case",
    common_prefix: "HCJR",
    alternative_prefixes: ["JR", "Judicial Review", "HC Judicial Review"],
    example_case_number: "HCJR/001/2026",
    example_reference: "Judicial review matter before the High Court",
    source_url: "https://kenyalaw.org/",
    description: "Judicial review matter before the High Court.",
    suggested_system_code: "HC_JUDICIAL_REVIEW",
    parent_category: "Judicial Review",
    archive_indexing_notes: "Capture application subtype, relief sought, station, and year.",
    confidence_level: "High",
    requires_registry_verification: false,
    notes: "Judicial review appears explicitly in public materials.",
  },
  // ── Gender Justice (Magistrate Court) ──────────────────────────────────
  {
    court_level: "Magistrates Court",
    division: "Gender Justice",
    case_category_name: "Magistrate Gender Justice Case",
    common_prefix: "MGJC",
    alternative_prefixes: ["MGJ", "Gender Justice", "MC Gender"],
    example_case_number: "MGJC/001/2026",
    example_reference: "Gender justice matter at Magistrate level",
    source_url: "https://judiciary.go.ke/",
    description: "Gender justice case before the Magistrate's Court.",
    suggested_system_code: "MC_GENDER_JUSTICE",
    parent_category: "Gender Justice",
    archive_indexing_notes: "Index by parties, gender issue type, protection orders, and year.",
    confidence_level: "Medium",
    requires_registry_verification: true,
    notes: "Emerging category for gender-based violence and related matters.",
  },
  // ── Tribunal & Regulatory (Magistrate Court) ───────────────────────────
  {
    court_level: "Magistrates Court",
    division: "Tribunal / Regulatory",
    case_category_name: "Magistrate Tribunal and Regulatory Case",
    common_prefix: "MCTRBC",
    alternative_prefixes: ["MC Tribunal", "MC Regulatory", "MC By-Laws"],
    example_case_number: "MCTRBC/001/2026",
    example_reference: "Tribunal or regulatory matter at Magistrate level",
    source_url: "https://judiciary.go.ke/",
    description: "Tribunal and regulatory matter before the Magistrate's Court.",
    suggested_system_code: "MC_TRIBUNAL",
    parent_category: "Tribunal & Regulatory",
    archive_indexing_notes: "Index by original forum, appeal path, division, officer, and date.",
    confidence_level: "Medium",
    requires_registry_verification: true,
    notes: "Covers rent tribunals, county by-laws, physical planning, and public health.",
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
  "Commercial",
  "Constitutional",
  "Probate",
  "Traffic",
  "Succession",
  "Children & Protection",
  "Employment & Labour",
  "Anti-Corruption & Economic Crimes",
  "Election",
  "Judicial Review",
  "Gender Justice",
  "Tribunal & Regulatory",
] as const;
