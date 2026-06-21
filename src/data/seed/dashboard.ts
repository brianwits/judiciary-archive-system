import type { DashboardData, RegistryRequest } from "@/types/dashboard";

export const SEED_DASHBOARD: DashboardData = {
  activeCasesCount: 247,
  registryRequestsCount: 12,
  kpis: [
    { label: "Active Files", value: "2,847", trend: "↑ 8.2% vs last month", trendDirection: "up", variant: "success" },
    { label: "Archived Files", value: "18,234", progress: 73, variant: "default" },
    { label: "Missing Files", value: "12", trend: "↓ 3 files vs last month", trendDirection: "down", variant: "danger" },
    { label: "Pending Returns", value: "47", trend: "↓ 5 overdue vs last month", trendDirection: "down", variant: "warning" },
    { label: "Scanned Today", value: "156", trend: "↑ 12.5% vs last month", trendDirection: "up", variant: "success" },
    { label: "Registry Requests", value: "89", progress: 64, variant: "default" },
    { label: "Audit Flags", value: "3", variant: "warning" },
    { label: "Active Users", value: "24", variant: "default" },
  ],
  notices: [
    { id: "n1", title: "Archive Room R4 Near Capacity", body: "Room D commercial cases at 91% occupancy. Consider redistribution.", author: "Grace Akinyi", priority: "high", createdAt: "2026-05-19T07:00:00Z" },
    { id: "n2", title: "Quarterly Audit Scheduled", body: "Physical file audit begins June 1, 2026. All departments to prepare.", author: "John Kamau", priority: "normal", createdAt: "2026-05-18T10:00:00Z" },
    { id: "n3", title: "New Scanning Protocol", body: "All new filings must be scanned within 48 hours of receipt.", author: "Mary Wanjiku", priority: "normal", createdAt: "2026-05-17T14:00:00Z" },
  ],
  memos: [
    { id: "m1", title: "File Retrieval Procedures Update", reference: "MEMO/REG/2026/045", author: "David Mutua", createdAt: "2026-05-15T09:00:00Z" },
    { id: "m2", title: "Archive Code Standardization", reference: "MEMO/ICT/2026/012", author: "Mary Wanjiku", createdAt: "2026-05-10T11:00:00Z" },
  ],
  broadcasts: [
    { id: "b1", title: "System Maintenance Window", message: "Scheduled maintenance on May 25, 2026 from 22:00 to 02:00 EAT.", author: "ICT Department", createdAt: "2026-05-19T06:00:00Z" },
    { id: "b2", title: "New User Training", message: "Archive system training for registry staff on May 22, 2026.", author: "HR Department", createdAt: "2026-05-16T08:00:00Z" },
  ],
  approvals: [
    { id: "a1", title: "File Destruction Request - HCCC/112/2018", requester: "Grace Akinyi", type: "Destruction", status: "pending", createdAt: "2026-05-18T10:00:00Z" },
    { id: "a2", title: "Extended Checkout - COM/234/2024", requester: "Peter Ochieng", type: "Extension", status: "pending", createdAt: "2026-05-17T15:00:00Z" },
    { id: "a3", title: "New Archive Room Allocation", requester: "David Mutua", type: "Allocation", status: "approved", createdAt: "2026-05-15T09:00:00Z" },
  ],
  alerts: [
    { id: "al1", title: "Overdue Return", message: "COM/234/2024 overdue by 4 days", severity: "danger", createdAt: "2026-05-19T08:00:00Z" },
    { id: "al2", title: "Missing File Alert", message: "MCCR/567/2023 still unlocated", severity: "warning", createdAt: "2026-05-18T12:00:00Z" },
    { id: "al3", title: "Room Capacity Warning", message: "R4 at 91% capacity", severity: "warning", createdAt: "2026-05-17T09:00:00Z" },
  ],
};

export const SEED_REGISTRY_REQUESTS: RegistryRequest[] = [
  { id: "rr-001", caseNumber: "HCCR/123/2025", requestType: "Certified Copy", requester: "Adv. Kimani", status: "pending", createdAt: "2026-05-19T08:30:00Z" },
  { id: "rr-002", caseNumber: "FAM/089/2025", requestType: "File Inspection", requester: "Jane Wanjiru", status: "in_progress", createdAt: "2026-05-18T14:00:00Z" },
  { id: "rr-003", caseNumber: "ELC/E018/2023", requestType: "Archive Retrieval", requester: "Green Valley Ltd", status: "completed", createdAt: "2026-05-17T10:00:00Z" },
  { id: "rr-004", caseNumber: "COM/234/2024", requestType: "Party Search", requester: "Digital Corp", status: "pending", createdAt: "2026-05-19T07:00:00Z" },
  { id: "rr-005", caseNumber: "CON/012/2025", requestType: "Certified Copy", requester: "Citizens Coalition", status: "pending", createdAt: "2026-05-16T11:00:00Z" },
];

export const REPORT_DATA = {
  archiveGrowth: [
    { month: "Jan", count: 15200 },
    { month: "Feb", count: 15800 },
    { month: "Mar", count: 16300 },
    { month: "Apr", count: 17100 },
    { month: "May", count: 17800 },
    { month: "Jun", count: 18234 },
  ],
  missingTrend: [
    { month: "Jan", count: 18 },
    { month: "Feb", count: 15 },
    { month: "Mar", count: 14 },
    { month: "Apr", count: 13 },
    { month: "May", count: 12 },
  ],
  movementFrequency: [
    { week: "W1", checkouts: 45, returns: 42 },
    { week: "W2", checkouts: 52, returns: 48 },
    { week: "W3", checkouts: 38, returns: 41 },
    { week: "W4", checkouts: 61, returns: 55 },
  ],
  divisionStats: [
    { name: "High Court", value: 35 },
    { name: "Magistrate", value: 25 },
    { name: "Commercial", value: 18 },
    { name: "Family", value: 12 },
    { name: "ELC", value: 10 },
  ],
  retrievalPerformance: [
    { division: "High Court", avgHours: 4.2 },
    { division: "Commercial", avgHours: 3.8 },
    { division: "Family", avgHours: 5.1 },
    { division: "ELC", avgHours: 6.3 },
  ],
  scanningPerformance: [
    { day: "Mon", scans: 142 },
    { day: "Tue", scans: 156 },
    { day: "Wed", scans: 148 },
    { day: "Thu", scans: 163 },
    { day: "Fri", scans: 156 },
  ],
  courtLevelStats: [
    { name: "High Court", value: 22 },
    { name: "Magistrate Court", value: 8 },
  ],
  familyStats: [
    { name: "Civil", value: 10 },
    { name: "Criminal", value: 8 },
    { name: "Commercial", value: 6 },
    { name: "Family", value: 6 },
  ],
  caseTypeStats: [
    { caseTypeId: 19, code: "HCCC", name: "High Court Civil Case", fullLabel: "HCCC - High Court Civil Case", courtLevel: "High Court", family: "Civil", value: 10 },
    { caseTypeId: 9, code: "HCCRC", name: "High Court Criminal Case", fullLabel: "HCCRC - High Court Criminal Case", courtLevel: "High Court", family: "Criminal", value: 6 },
    { caseTypeId: 33, code: "MCCR", name: "Magistrate Court Criminal Case", fullLabel: "MCCR - Magistrate Court Criminal Case", courtLevel: "Magistrate Court", family: "Criminal", value: 2 },
  ],
  unclassifiedCount: 0,
  totalCases: 30,
};
