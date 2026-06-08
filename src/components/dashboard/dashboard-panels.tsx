import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Alert, Approval, Broadcast, Memo, Notice } from "@/types/dashboard";

type DashboardPanelsProps = {
  approvals: Approval[];
  notices: Notice[];
  memos: Memo[];
  broadcasts: Broadcast[];
  alerts: Alert[];
};

const APPROVAL_STATUS: Record<Approval["status"], string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

const ALERT_SEVERITY: Record<Alert["severity"], string> = {
  info: "bg-primary/15 text-primary",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/15 text-destructive",
};

const cardElevated =
  "border-border/50 shadow-[var(--shadow-premium)] ring-1 ring-border/45 transition-shadow duration-300 hover:shadow-[0_14px_28px_-8px_rgb(0_0_0/0.12)]";

function PanelList({
  items,
  emptyMessage,
}: {
  items: { id: string; title: string; subtitle?: string; meta?: string; badge?: React.ReactNode }[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium leading-snug">{item.title}</p>
            {item.subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-2">{item.subtitle}</p>
            )}
            {item.meta && <p className="text-xs text-muted-foreground">{item.meta}</p>}
          </div>
          {item.badge}
        </li>
      ))}
    </ul>
  );
}

export function DashboardPanels({
  approvals,
  notices,
  memos,
  broadcasts,
  alerts,
}: DashboardPanelsProps) {
  return (
    <Card className={cn("rounded-2xl", cardElevated)}>
      <CardHeader>
        <CardTitle>Communications & Workflow</CardTitle>
        <CardDescription>Approvals, notices, memos, broadcasts, and system alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="approvals">
          <div className="-mx-1 mb-4 max-w-full overflow-x-auto overscroll-x-contain px-1 [scrollbar-width:thin] md:mx-0 md:px-0">
            <TabsList className="inline-flex min-w-max flex-nowrap justify-start gap-1">
              <TabsTrigger className="flex-none" value="approvals">
                Approvals ({approvals.length})
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="notices">
                Notices ({notices.length})
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="memos">
                Memos ({memos.length})
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="broadcasts">
                Broadcasts ({broadcasts.length})
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="alerts">
                Alerts ({alerts.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="approvals">
            <PanelList
              emptyMessage="No pending approvals."
              items={approvals.map((a) => ({
                id: a.id,
                title: a.title,
                subtitle: `${a.type} • ${a.requester}`,
                meta: format(new Date(a.createdAt), "d MMM yyyy"),
                badge: (
                  <Badge variant="outline" className={cn("shrink-0 capitalize", APPROVAL_STATUS[a.status])}>
                    {a.status}
                  </Badge>
                ),
              }))}
            />
          </TabsContent>

          <TabsContent value="notices">
            <PanelList
              emptyMessage="No notices posted."
              items={notices.map((n) => ({
                id: n.id,
                title: n.title,
                subtitle: n.body,
                meta: `${n.author} • ${format(new Date(n.createdAt), "d MMM yyyy")}`,
                badge: (
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {n.priority}
                  </Badge>
                ),
              }))}
            />
          </TabsContent>

          <TabsContent value="memos">
            <PanelList
              emptyMessage="No memos on file."
              items={memos.map((m) => ({
                id: m.id,
                title: m.title,
                subtitle: m.reference,
                meta: `${m.author} • ${format(new Date(m.createdAt), "d MMM yyyy")}`,
              }))}
            />
          </TabsContent>

          <TabsContent value="broadcasts">
            <PanelList
              emptyMessage="No broadcasts."
              items={broadcasts.map((b) => ({
                id: b.id,
                title: b.title,
                subtitle: b.message,
                meta: `${b.author} • ${format(new Date(b.createdAt), "d MMM yyyy")}`,
              }))}
            />
          </TabsContent>

          <TabsContent value="alerts">
            <PanelList
              emptyMessage="No active alerts."
              items={alerts.map((a) => ({
                id: a.id,
                title: a.title,
                subtitle: a.message,
                meta: format(new Date(a.createdAt), "d MMM yyyy HH:mm"),
                badge: (
                  <Badge variant="outline" className={cn("shrink-0 capitalize", ALERT_SEVERITY[a.severity])}>
                    {a.severity}
                  </Badge>
                ),
              }))}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
