export type KpiMetric = {
  label: string;
  value: number | string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  progress?: number;
  variant?: "default" | "success" | "warning" | "danger";
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  author: string;
  priority: "low" | "normal" | "high";
  createdAt: string;
};

export type Memo = {
  id: string;
  title: string;
  reference: string;
  author: string;
  createdAt: string;
};

export type Broadcast = {
  id: string;
  title: string;
  message: string;
  author: string;
  createdAt: string;
};

export type Approval = {
  id: string;
  title: string;
  requester: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type Alert = {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger";
  createdAt: string;
};

export type RegistryRequest = {
  id: string;
  caseNumber: string;
  requestType: string;
  requester: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  createdAt: string;
};

export type DashboardData = {
  kpis: KpiMetric[];
  notices: Notice[];
  memos: Memo[];
  broadcasts: Broadcast[];
  approvals: Approval[];
  alerts: Alert[];
  activeCasesCount: number;
  registryRequestsCount: number;
};
