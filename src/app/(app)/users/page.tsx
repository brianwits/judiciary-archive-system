import { UsersManagementTable } from "@/components/users/users-management-table";
import { UsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/layout/page-header";
import { isMockDataEnabled } from "@/lib/config";
import { getUsers } from "@/lib/data";
import { canManageUsers, getSessionProfile } from "@/lib/auth";
import { listProfiles } from "@/app/actions/users";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const profile = await getSessionProfile();
  if (!profile || !canManageUsers(profile.role)) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Assign roles and manage court staff access to the archive system"
      />
      {isMockDataEnabled() ? (
        <UsersManagementTable users={await getUsers()} />
      ) : (
        <UsersTable profiles={await listProfiles()} />
      )}
    </div>
  );
}
