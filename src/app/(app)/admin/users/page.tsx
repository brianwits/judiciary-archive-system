import { listProfiles } from "@/app/actions/users";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const profiles = await listProfiles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="text-sm text-muted-foreground">
          Assign roles for archive access. New users default to read-only.
        </p>
      </div>
      <UsersTable profiles={profiles} />
    </div>
  );
}
