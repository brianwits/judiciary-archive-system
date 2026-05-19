"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateUserRole } from "@/app/actions/users";
import { FormError } from "@/components/shared/form-error";
import { ResponsiveTableShell } from "@/components/shared/responsive-table-shell";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProfileRow, UserRole } from "@/types/database";

export function UsersTable({ profiles }: { profiles: ProfileRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: UserRole) {
    setPendingId(userId);
    setError(null);
    try {
      const result = await updateUserRole(userId, role);
      if (!result.ok) setError(result.error.message);
      else router.refresh();
    } catch {
      setError("Unable to update the user role. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <FormError message={error} />
      <ResponsiveTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">
                  {profile.full_name ?? "—"}
                </TableCell>
                <TableCell>
                  <Select
                    value={profile.role}
                    disabled={pendingId === profile.id}
                    onValueChange={(value) =>
                      handleRoleChange(profile.id, value as UserRole)
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="readonly">Read-only</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTableShell>
    </div>
  );
}
