export const CASE_FAMILIES = [
  "Civil",
  "Criminal",
  "Commercial",
  "Family",
  "Children & Protection",
  "Succession & Probate",
  "Traffic",
  "Environment & Land",
  "Employment & Labour",
  "Anti-Corruption & Economic Crimes",
  "Election",
  "Judicial Review",
  "Constitutional & Human Rights",
  "Gender Justice",
  "Tribunal & Regulatory",
] as const;

export type CaseFamily = (typeof CASE_FAMILIES)[number];
export type CourtLevel = "Magistrate Court" | "High Court";

export type CaseTypeDefinition = {
  caseTypeId: number;
  code: string;
  caseType: string;
  fullLabel: string;
  courtLevel: CourtLevel;
  caseFamily: CaseFamily;
  active: boolean;
};

type DefinitionInput = Omit<CaseTypeDefinition, "fullLabel" | "active">;

function define(input: DefinitionInput): CaseTypeDefinition {
  return {
    ...input,
    fullLabel: `${input.code} - ${input.caseType}`,
    active: true,
  };
}

export const CASE_TYPE_DEFINITIONS: readonly CaseTypeDefinition[] = [
  define({ caseTypeId: 31, code: "MCCC", caseType: "Magistrate Court Civil Case", courtLevel: "Magistrate Court", caseFamily: "Civil" }),
  define({ caseTypeId: 32, code: "MCCCMISC", caseType: "Magistrate Court Civil Miscellaneous", courtLevel: "Magistrate Court", caseFamily: "Civil" }),
  define({ caseTypeId: 33, code: "MCCR", caseType: "Magistrate Court Criminal Case", courtLevel: "Magistrate Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 34, code: "MCCRMISC", caseType: "Magistrate Court Criminal Miscellaneous", courtLevel: "Magistrate Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 35, code: "MCTR", caseType: "Magistrate Court Traffic Case", courtLevel: "Magistrate Court", caseFamily: "Traffic" }),
  define({ caseTypeId: 37, code: "MCSUCC", caseType: "Magistrate Court Succession Matter", courtLevel: "Magistrate Court", caseFamily: "Succession & Probate" }),
  define({ caseTypeId: 38, code: "MCP&CPS", caseType: "Magistrate Court Protection and Care - Police Station", courtLevel: "Magistrate Court", caseFamily: "Children & Protection" }),
  define({ caseTypeId: 40, code: "MCCHCC", caseType: "Magistrate Court Civil Cases - Children", courtLevel: "Magistrate Court", caseFamily: "Children & Protection" }),
  define({ caseTypeId: 42, code: "MCAC", caseType: "Magistrate Court Anti-Corruption", courtLevel: "Magistrate Court", caseFamily: "Anti-Corruption & Economic Crimes" }),
  define({ caseTypeId: 61, code: "MCCOMMSU", caseType: "Magistrate Court Commercial Suits", courtLevel: "Magistrate Court", caseFamily: "Commercial" }),
  define({ caseTypeId: 62, code: "MCDC", caseType: "Magistrate Court Divorce Case", courtLevel: "Magistrate Court", caseFamily: "Family" }),
  define({ caseTypeId: 64, code: "MCRTC", caseType: "Magistrate Court Rent Tribunal Cause", courtLevel: "Magistrate Court", caseFamily: "Tribunal & Regulatory" }),
  define({ caseTypeId: 70, code: "MCACMISC", caseType: "Magistrate Court Anti-Corruption Miscellaneous", courtLevel: "Magistrate Court", caseFamily: "Anti-Corruption & Economic Crimes" }),
  define({ caseTypeId: 71, code: "MCINQ", caseType: "Inquest", courtLevel: "Magistrate Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 72, code: "MCSO", caseType: "Sexual Offences", courtLevel: "Magistrate Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 73, code: "MCEO", caseType: "Election Offences", courtLevel: "Magistrate Court", caseFamily: "Election" }),
  define({ caseTypeId: 83, code: "MCP&CCO", caseType: "Magistrate Court Protection and Care-Children Office", courtLevel: "Magistrate Court", caseFamily: "Children & Protection" }),
  define({ caseTypeId: 84, code: "MCCHCR", caseType: "Magistrate Court Criminal - Children", courtLevel: "Magistrate Court", caseFamily: "Children & Protection" }),
  define({ caseTypeId: 92, code: "MCWC", caseType: "Magistrate Court Workmens Compensation", courtLevel: "Magistrate Court", caseFamily: "Employment & Labour" }),
  define({ caseTypeId: 93, code: "MCELRC", caseType: "Magistrate Court Employment and Labour Relations", courtLevel: "Magistrate Court", caseFamily: "Employment & Labour" }),
  define({ caseTypeId: 95, code: "MCELC", caseType: "Magistrate Court Environment and Land Case", courtLevel: "Magistrate Court", caseFamily: "Environment & Land" }),
  define({ caseTypeId: 113, code: "MCELCMISC", caseType: "Environmental and Land Misc", courtLevel: "Magistrate Court", caseFamily: "Environment & Land" }),
  define({ caseTypeId: 116, code: "MCPCR", caseType: "Magistrate Court Petty Criminal", courtLevel: "Magistrate Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 128, code: "MCEP", caseType: "Election Petition", courtLevel: "Magistrate Court", caseFamily: "Election" }),
  define({ caseTypeId: 178, code: "MCSUCCMISC", caseType: "Magistrate Court Succession Miscellaneous", courtLevel: "Magistrate Court", caseFamily: "Succession & Probate" }),
  define({ caseTypeId: 184, code: "MCCBLC", caseType: "Magistrate Court County By- Laws Case", courtLevel: "Magistrate Court", caseFamily: "Tribunal & Regulatory" }),
  define({ caseTypeId: 185, code: "MCPPC", caseType: "Magistrate Court Physical Planning Case", courtLevel: "Magistrate Court", caseFamily: "Tribunal & Regulatory" }),
  define({ caseTypeId: 186, code: "MCPHC", caseType: "Magistrate Court Public Health Case", courtLevel: "Magistrate Court", caseFamily: "Tribunal & Regulatory" }),
  define({ caseTypeId: 229, code: "MCCHSO", caseType: "Sexual Offence - Children", courtLevel: "Magistrate Court", caseFamily: "Children & Protection" }),
  define({ caseTypeId: 288, code: "MCCGCR", caseType: "Magistrates Court County Government Criminal Matters", courtLevel: "Magistrate Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 289, code: "MCCGCRMISC", caseType: "Magistrates Court County Government Criminal Miscellaneous", courtLevel: "Magistrate Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 296, code: "MGJCCR", caseType: "Magistrates Gender Justice Criminal Case", courtLevel: "Magistrate Court", caseFamily: "Gender Justice" }),
  define({ caseTypeId: 297, code: "MGJCC", caseType: "Magistrates Gender Justice Civil Case", courtLevel: "Magistrate Court", caseFamily: "Gender Justice" }),
  define({ caseTypeId: 301, code: "MCELRCMISC", caseType: "Employment and Labour Miscellaneous", courtLevel: "Magistrate Court", caseFamily: "Employment & Labour" }),

  define({ caseTypeId: 9, code: "HCCRC", caseType: "High Court Criminal Case", courtLevel: "High Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 10, code: "HCCRMISCAPPL", caseType: "High Court Criminal Miscellaneous Application", courtLevel: "High Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 11, code: "HCCRA", caseType: "High Court Criminal Appeal", courtLevel: "High Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 12, code: "HCCRREV", caseType: "High Court Criminal Revision", courtLevel: "High Court", caseFamily: "Criminal" }),
  define({ caseTypeId: 13, code: "HCCOMM", caseType: "High Court Commercial Suit", courtLevel: "High Court", caseFamily: "Commercial" }),
  define({ caseTypeId: 14, code: "HCCOMMMISC", caseType: "High Court Commercial Miscellaneous", courtLevel: "High Court", caseFamily: "Commercial" }),
  define({ caseTypeId: 15, code: "HCCOMMINP", caseType: "High Court Commercial Insolvency Notice Petition", courtLevel: "High Court", caseFamily: "Commercial" }),
  define({ caseTypeId: 16, code: "HCCOMMITA", caseType: "High Court Commercial Income Tax Appeal", courtLevel: "High Court", caseFamily: "Commercial" }),
  define({ caseTypeId: 17, code: "HCCOMMIC", caseType: "High Court Commercial Insolvency Cause", courtLevel: "High Court", caseFamily: "Commercial" }),
  define({ caseTypeId: 18, code: "HCCOMMIN", caseType: "High Court Commercial Insolvency Notice", courtLevel: "High Court", caseFamily: "Commercial" }),
  define({ caseTypeId: 19, code: "HCCC", caseType: "High Court Civil Case", courtLevel: "High Court", caseFamily: "Civil" }),
  define({ caseTypeId: 20, code: "HCCCMISC", caseType: "High Court Civil Case Miscellaneous", courtLevel: "High Court", caseFamily: "Civil" }),
  define({ caseTypeId: 21, code: "HCCA", caseType: "High Court Civil Appeal", courtLevel: "High Court", caseFamily: "Civil" }),
  define({ caseTypeId: 22, code: "HCFA", caseType: "High Court Family Appeal", courtLevel: "High Court", caseFamily: "Family" }),
  define({ caseTypeId: 23, code: "HCFMISC", caseType: "High Court Family Miscellaneous", courtLevel: "High Court", caseFamily: "Family" }),
  define({ caseTypeId: 24, code: "HCFP&A", caseType: "High Court Family Probate and Administration", courtLevel: "High Court", caseFamily: "Succession & Probate" }),
  define({ caseTypeId: 25, code: "HCFDC", caseType: "High Court Family Divorce Cause", courtLevel: "High Court", caseFamily: "Family" }),
  define({ caseTypeId: 26, code: "HCFADOP", caseType: "High Court Family Adoption", courtLevel: "High Court", caseFamily: "Family" }),
  define({ caseTypeId: 29, code: "HCJR", caseType: "High Court Judicial Review", courtLevel: "High Court", caseFamily: "Judicial Review" }),
  define({ caseTypeId: 30, code: "HCJRMISC", caseType: "High Court Judicial Review Miscellaneous", courtLevel: "High Court", caseFamily: "Judicial Review" }),
  define({ caseTypeId: 43, code: "HCACECMISC", caseType: "High Court Anti-corruption and Economic Crimes Miscellaneous", courtLevel: "High Court", caseFamily: "Anti-Corruption & Economic Crimes" }),
  define({ caseTypeId: 58, code: "HCCHRPET", caseType: "High Court Constitution and Human Rights Petitions (Civil)", courtLevel: "High Court", caseFamily: "Constitutional & Human Rights" }),
  define({ caseTypeId: 59, code: "HCCHRPETMISC", caseType: "High Court Constitution and Human Rights Petitions Miscellaneous", courtLevel: "High Court", caseFamily: "Constitutional & Human Rights" }),
  define({ caseTypeId: 76, code: "HCJRELC", caseType: "High Court Judicial Review ELC", courtLevel: "High Court", caseFamily: "Judicial Review" }),
  define({ caseTypeId: 80, code: "HCCHREPA", caseType: "High Court Constitution and Human Rights Election Petition Appeal", courtLevel: "High Court", caseFamily: "Election" }),
  define({ caseTypeId: 81, code: "HCCHRMEPA", caseType: "High Court Constitution and Human Rights Miscellaneous Election Petition Appeal(MEPA)", courtLevel: "High Court", caseFamily: "Election" }),
  define({ caseTypeId: 89, code: "HCCHREP", caseType: "High Court Constitution and Human Rights Election Petition", courtLevel: "High Court", caseFamily: "Election" }),
  define({ caseTypeId: 108, code: "HCFOS", caseType: "High Court Family Originating Summons", courtLevel: "High Court", caseFamily: "Family" }),
  define({ caseTypeId: 226, code: "HCACECJR", caseType: "High Court Anticorruption and Economic Crimes Judicial Review", courtLevel: "High Court", caseFamily: "Anti-Corruption & Economic Crimes" }),
  define({ caseTypeId: 247, code: "HCCOMMARB", caseType: "High Court Commercial Arbitration", courtLevel: "High Court", caseFamily: "Commercial" }),
  define({ caseTypeId: 258, code: "HCCHRPET", caseType: "High Court Constitution and Human Rights Petitions (Criminal)", courtLevel: "High Court", caseFamily: "Constitutional & Human Rights" }),
  define({ caseTypeId: 298, code: "HCGJCR", caseType: "High Court Gender Justice Criminal Case", courtLevel: "High Court", caseFamily: "Gender Justice" }),
  define({ caseTypeId: 299, code: "HCGJCRA", caseType: "High Court Gender Justice Criminal Appeal", courtLevel: "High Court", caseFamily: "Gender Justice" }),
  define({ caseTypeId: 300, code: "HCGJCA", caseType: "High Court Gender Justice Civil Appeal", courtLevel: "High Court", caseFamily: "Gender Justice" }),
  define({ caseTypeId: 343, code: "HCCSCA", caseType: "High Court Civil Small Claims Appeal", courtLevel: "High Court", caseFamily: "Civil" }),
];

export const CASE_TYPE_BY_ID = new Map(
  CASE_TYPE_DEFINITIONS.map((definition) => [definition.caseTypeId, definition]),
);

export function getCaseTypeDefinition(caseTypeId: number | null | undefined) {
  return caseTypeId == null ? null : CASE_TYPE_BY_ID.get(caseTypeId) ?? null;
}
