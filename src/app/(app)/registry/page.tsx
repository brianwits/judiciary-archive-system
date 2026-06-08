import dynamic from "next/dynamic";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { TablePanelSkeleton } from "@/components/shared/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionProfile } from "@/lib/auth";
import { getRegistryRequests } from "@/lib/data";
import { hasPermission } from "@/types/roles";

const DynamicRegistryRequestForm = dynamic(
  () => import("@/components/registry/registry-request-form").then((m) => ({ default: m.RegistryRequestForm })),
);
const DynamicRegistryRequestsTable = dynamic(
  () => import("@/components/registry/registry-requests-table").then((m) => ({ default: m.RegistryRequestsTable })),
);

export default async function RegistryPage() {
  const [requests, profile] = await Promise.all([getRegistryRequests(), getSessionProfile()]);
  const pendingCount = requests.filter((item) => item.status === "pending").length;
  const canManage = profile ? hasPermission(profile.role, "registry_ops") : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registry Operations"
        subtitle={`${requests.length} registry service requests · ${pendingCount} pending`}
      />

      {canManage ? (
        <Suspense fallback={<FormSkeleton />}>
          <DynamicRegistryRequestForm />
        </Suspense>
      ) : null}

      <Suspense fallback={<TablePanelSkeleton rows={6} />}>
        <DynamicRegistryRequestsTable requests={requests} canUpdate={canManage} />
      </Suspense>
    </div>
  );
}

/** Skeleton shown while the registry request form chunk loads. */
function FormSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </CardContent>
    </Card>
  );
}
