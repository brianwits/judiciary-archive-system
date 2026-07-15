import type { DashboardData, RegistryRequest } from "@/types/dashboard";
import { loadCasesFromCsv } from "@/lib/data/csv-loader";
import { buildMockReportData } from "@/lib/data/mock-analytics";

export const SEED_DASHBOARD: DashboardData = {
  activeCasesCount: 0, // computed dynamically in mock-store
  registryRequestsCount: 4,
  kpis: [
    { label: "Total Cases", value: "4,606", trend: "CTS mock dataset", trendDirection: "up", variant: "default" },
    { label: "Closed Cases", value: "4,606", progress: 100, variant: "success" },
    { label: "Missing Files", value: "0", trend: "0 reported", trendDirection: "up", variant: "success" },
    { label: "Pending Returns", value: "0", variant: "default" },
    { label: "Registry Requests", value: "4", progress: 64, variant: "default" },
    { label: "Audit Flags", value: "0", variant: "default" },
    { label: "Active Users", value: "8", variant: "default" },
    { label: "Categories", value: "6", variant: "default" },
  ],
  notices: [
    { id: "n1", title: "CTS Mock Dataset Ready", body: "Kabarnet closed-case records are available for explicit mock mode workflows.", author: "System", priority: "high", createdAt: "2026-07-13T07:00:00Z" },
    { id: "n2", title: "Quarterly Audit Scheduled", body: "Physical file audit begins August 1, 2026. All departments to prepare.", author: "John Kamau", priority: "normal", createdAt: "2026-07-12T10:00:00Z" },
    { id: "n3", title: "Data Source Change", body: "Mock mode now sources cases and reports from the Kabarnet CTS extract instead of demo samples.", author: "ICT Department", priority: "normal", createdAt: "2026-07-13T06:00:00Z" },
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
    { id: "al1", title: "CTS Data Loaded", message: "Kabarnet closed-case records are active for mock mode", severity: "info", createdAt: "2026-07-13T08:00:00Z" },
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

export const REPORT_DATA = buildMockReportData({
  cases: loadCasesFromCsv().cases,
});
