import type { DashboardData, RegistryRequest } from "@/types/dashboard";

export const SEED_DASHBOARD: DashboardData = {
  activeCasesCount: 0, // computed dynamically in mock-store
  registryRequestsCount: 4,
  kpis: [
    { label: "Total Cases", value: "16,505", trend: "↑ CTS Kabarnet import", trendDirection: "up", variant: "default" },
    { label: "Closed Cases", value: "16,505", progress: 95, variant: "success" },
    { label: "Missing Files", value: "0", trend: "0 reported", trendDirection: "up", variant: "success" },
    { label: "Pending Returns", value: "0", variant: "default" },
    { label: "Registry Requests", value: "4", progress: 64, variant: "default" },
    { label: "Audit Flags", value: "0", variant: "default" },
    { label: "Active Users", value: "8", variant: "default" },
    { label: "Categories", value: "12", variant: "default" },
  ],
  notices: [
    { id: "n1", title: "CTS Data Import Complete", body: "Kabarnet Magistrate Court cases (2000-2024) loaded from CTS system. Total: 16,505 records.", author: "System", priority: "high", createdAt: "2026-07-13T07:00:00Z" },
    { id: "n2", title: "Quarterly Audit Scheduled", body: "Physical file audit begins August 1, 2026. All departments to prepare.", author: "John Kamau", priority: "normal", createdAt: "2026-07-12T10:00:00Z" },
    { id: "n3", title: "Data Source Change", body: "Mock data now sourced from Kabarnet CTS extract. Verify data accuracy for your workflows.", author: "ICT Department", priority: "normal", createdAt: "2026-07-13T06:00:00Z" },
  ],
  memos: [
    { id: "m1", title: "File Retrieval Procedures Update", reference: "MEMO/REG/2026/045", author: "David Mutua", createdAt: "2026-07-10T09:00:00Z" },
    { id: "m2", title: "CTS Integration Notes", reference: "MEMO/ICT/2026/012", author: "Mary Wanjiku", createdAt: "2026-07-11T11:00:00Z" },
  ],
  broadcasts: [
    { id: "b1", title: "System Maintenance Window", message: "Scheduled maintenance on July 20, 2026 from 22:00 to 02:00 EAT.", author: "ICT Department", createdAt: "2026-07-13T06:00:00Z" },
    { id: "b2", title: "CTS Data Verification", message: "All staff to verify case records against physical files.", author: "Registry Department", createdAt: "2026-07-12T08:00:00Z" },
  ],
  approvals: [
    { id: "a1", title: "File Destruction Request - MCCR/1234/2018", requester: "Grace Akinyi", type: "Destruction", status: "pending", createdAt: "2026-07-10T10:00:00Z" },
    { id: "a2", title: "Extended Checkout - MCCC/E071/2024", requester: "Peter Ochieng", type: "Extension", status: "pending", createdAt: "2026-07-11T15:00:00Z" },
    { id: "a3", title: "New Archive Room Allocation", requester: "David Mutua", type: "Allocation", status: "approved", createdAt: "2026-07-09T09:00:00Z" },
  ],
  alerts: [
    { id: "al1", title: "CTS Data Loaded", message: "16,505 cases imported from Kabarnet CTS", severity: "info", createdAt: "2026-07-13T08:00:00Z" },
    { id: "al2", title: "Missing Archive Locations", message: "Imported cases have no physical shelf locations", severity: "warning", createdAt: "2026-07-13T12:00:00Z" },
    { id: "al3", title: "Room Capacity Warning", message: "R4 at 91% capacity", severity: "warning", createdAt: "2026-07-12T09:00:00Z" },
  ],
};

export const SEED_REGISTRY_REQUESTS: RegistryRequest[] = [
  { id: "rr-001", caseNumber: "MCCR/601/2024", requestType: "Certified Copy", requester: "Adv. Kimani", status: "pending", createdAt: "2026-07-13T08:30:00Z" },
  { id: "rr-002", caseNumber: "MCCC/E071/2024", requestType: "Archive Retrieval", requester: "KCB Bank Kenya Ltd", status: "pending", createdAt: "2026-07-12T10:00:00Z" },
  { id: "rr-003", caseNumber: "MCTR/E031/2024", requestType: "Party Search", requester: "Elias Kiplagat", status: "completed", createdAt: "2026-07-11T07:00:00Z" },
  { id: "rr-004", caseNumber: "MCCHCR/E010/2024", requestType: "Certified Copy", requester: "Children's Office", status: "pending", createdAt: "2026-07-10T11:00:00Z" },
];

export const REPORT_DATA = {
  archiveGrowth: [
    { month: "2000-2009", count: 4 },
    { month: "2010-2014", count: 7 },
    { month: "2015", count: 3 },
    { month: "2016", count: 7 },
    { month: "2017", count: 66 },
    { month: "2018", count: 78 },
    { month: "2019", count: 181 },
    { month: "2020", count: 1113 },
    { month: "2021", count: 2834 },
    { month: "2022", count: 1276 },
    { month: "2023", count: 1713 },
    { month: "2024", count: 1500 },
  ],
  missingTrend: [
    { month: "Jan", count: 0 },
    { month: "Feb", count: 0 },
    { month: "Mar", count: 0 },
    { month: "Apr", count: 0 },
    { month: "May", count: 0 },
  ],
  movementFrequency: [
    { week: "W1", checkouts: 0, returns: 0 },
    { week: "W2", checkouts: 0, returns: 0 },
    { week: "W3", checkouts: 0, returns: 0 },
    { week: "W4", checkouts: 0, returns: 0 },
  ],
  divisionStats: [
    { name: "Magistrate Court", value: 96 },
    { name: "High Court", value: 4 },
  ],
  retrievalPerformance: [],
  scanningPerformance: [
    { day: "Mon", scans: 0 },
    { day: "Tue", scans: 0 },
    { day: "Wed", scans: 0 },
    { day: "Thu", scans: 0 },
    { day: "Fri", scans: 0 },
  ],
  courtLevelStats: [
    { name: "Magistrate Court", value: 96 },
    { name: "High Court", value: 4 },
  ],
  familyStats: [
    { name: "Criminal", value: 14386 },
    { name: "Civil", value: 1500 },
    { name: "Traffic", value: 53 },
    { name: "Children & Protection", value: 7 },
    { name: "Gender Justice", value: 42 },
    { name: "Sexual Offences", value: 17 },
  ],
  caseTypeStats: [
    { caseTypeId: 33, code: "MCCR", name: "Magistrate Court Criminal Case", fullLabel: "MCCR - Magistrate Court Criminal Case", courtLevel: "Magistrate Court", value: 11000 },
    { caseTypeId: 34, code: "MCCRMISC", name: "Magistrate Court Criminal Miscellaneous", fullLabel: "MCCRMISC - Magistrate Court Criminal Miscellaneous", courtLevel: "Magistrate Court", value: 334 },
    { caseTypeId: 31, code: "MCCC", name: "Magistrate Court Civil Case", fullLabel: "MCCC - Magistrate Court Civil Case", courtLevel: "Magistrate Court", value: 77 },
    { caseTypeId: 32, code: "MCCCMISC", name: "Magistrate Court Civil Miscellaneous", fullLabel: "MCCCMISC - Magistrate Court Civil Miscellaneous", courtLevel: "Magistrate Court", value: 5 },
    { caseTypeId: 35, code: "MCTR", name: "Magistrate Court Traffic Case", fullLabel: "MCTR - Magistrate Court Traffic Case", courtLevel: "Magistrate Court", value: 31 },
    { caseTypeId: 84, code: "MCCHCR", name: "Magistrate Court Criminal - Children", fullLabel: "MCCHCR - Magistrate Court Criminal - Children", courtLevel: "Magistrate Court", value: 10 },
    { caseTypeId: 72, code: "MCSO", name: "Sexual Offences", fullLabel: "MCSO - Sexual Offences", courtLevel: "Magistrate Court", value: 15 },
    { caseTypeId: 296, code: "MGJCCR", name: "Magistrates Gender Justice Criminal Case", fullLabel: "MGJCCR - Magistrates Gender Justice Criminal Case", courtLevel: "Magistrate Court", value: 1 },
    { caseTypeId: 288, code: "MCCGCR", name: "Magistrates Court County Government Criminal Matters", fullLabel: "MCCGCR - Magistrates Court County Government Criminal Matters", courtLevel: "Magistrate Court", value: 1 },
    { caseTypeId: 289, code: "MCCGCRMISC", name: "Magistrates Court County Government Criminal Miscellaneous", fullLabel: "MCCGCRMISC - Magistrates Court County Government Criminal Miscellaneous", courtLevel: "Magistrate Court", value: 1 },
    { caseTypeId: 116, code: "MCPCR", name: "Magistrate Court Petty Criminal", fullLabel: "MCPCR - Magistrate Court Petty Criminal", courtLevel: "Magistrate Court", value: 2 },
    { caseTypeId: 71, code: "MCINQ", name: "Inquest", fullLabel: "MCINQ - Inquest", courtLevel: "Magistrate Court", value: 1 },
    { caseTypeId: 9, code: "HCCRC", name: "High Court Criminal Case", fullLabel: "HCCRC - High Court Criminal Case", courtLevel: "High Court", value: 189 },
    { caseTypeId: 10, code: "HCCRMISCAPPL", name: "High Court Criminal Miscellaneous Application", fullLabel: "HCCRMISCAPPL - High Court Criminal Miscellaneous Application", courtLevel: "High Court", value: 197 },
  ],
  caseCategoryStats: [
    { categoryCode: "MC_CRIMINAL", categoryName: "Magistrate Court Criminal Case", courtLevel: "Magistrate Court", value: 12000 },
    { categoryCode: "MC_CIVIL", categoryName: "Magistrate Court Civil Case", courtLevel: "Magistrate Court", value: 1500 },
    { categoryCode: "MC_TRAFFIC", categoryName: "Magistrate Court Traffic Case", courtLevel: "Magistrate Court", value: 53 },
    { categoryCode: "MC_CHILDREN_PROTECTION", categoryName: "Magistrate Children's Protection Case", courtLevel: "Magistrate Court", value: 10 },
    { categoryCode: "MC_GENDER_JUSTICE", categoryName: "Magistrate Gender Justice Case", courtLevel: "Magistrate Court", value: 1 },
    { categoryCode: "MC_SEXUAL_OFFENCE", categoryName: "Magistrate Sexual Offence Case", courtLevel: "Magistrate Court", value: 15 },
    { categoryCode: "MC_SUCCESSION", categoryName: "Magistrate Court Succession Matter", courtLevel: "Magistrate Court", value: 0 },
    { categoryCode: "HC_CRIMINAL", categoryName: "High Court Criminal Case", courtLevel: "High Court", value: 386 },
  ],
  unclassifiedCount: 0,
  totalCases: 16891,
};
