import { listProfiles } from "@/app/actions/users";
import { UsersTable } from "@/components/admin/users-table";
import { UsersManagementTable } from "@/components/users/users-management-table";
import { isMockDataEnabled } from "@/lib/config";
import { getUsers } from "@/lib/data";

export default async function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="text-sm text-muted-foreground">
          Assign roles for archive access. New users default to read-only.
        </p>
      </div>
      {isMockDataEnabled() ? (
        <UsersManagementTable users={await getUsers()} />
      ) : (
        <UsersTable profiles={await listProfiles()} />
      )}
    </div>
  );
}
