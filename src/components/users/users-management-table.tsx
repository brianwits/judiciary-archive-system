"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateMockUserRole, updateUserDetails } from "@/app/actions/users";
import { AsyncButton } from "@/components/shared/async-button";
import { FormError } from "@/components/shared/form-error";
import { ResponsiveTableShell } from "@/components/shared/responsive-table-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ROLE_LABELS, USER_ROLES } from "@/types/roles";
import type { UserProfile } from "@/types/user";

export function UsersManagementTable({ users }: { users: UserProfile[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: string) {
    setPendingId(userId);
    setError(null);
    try {
      const result = await updateMockUserRole(userId, role);
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
              <TableHead>Email</TableHead>
              <TableHead>PJ Number</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>{user.pjNumber ?? "—"}</TableCell>
                <TableCell>{user.department ?? "—"}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    disabled={pendingId === user.id}
                    onValueChange={(value) => handleRoleChange(user.id, value ?? user.role)}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "outline" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <EditMockUserDialog
                    user={user}
                    pending={pendingId === user.id}
                    onPendingChange={setPendingId}
                    onError={setError}
                    onUpdated={() => router.refresh()}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTableShell>
    </div>
  );
}

function EditMockUserDialog({
  user,
  pending,
  onPendingChange,
  onError,
  onUpdated,
}: {
  user: UserProfile;
  pending: boolean;
  onPendingChange: (id: string | null) => void;
  onError: (message: string | null) => void;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(user.role);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setRole(user.role);
    setOpen(nextOpen);
  }


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onPendingChange(user.id);
    onError(null);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("role", role);
      const result = await updateUserDetails(user.id, formData);
      if (!result.ok) {
        onError(result.error.message);
        return;
      }
      setOpen(false);
      onUpdated();
    } catch {
      onError("Unable to update the user details. Please try again.");
    } finally {
      onPendingChange(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            aria-label={`Edit ${user.fullName}`}
            size="icon-sm"
            variant="outline"
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit user details</DialogTitle>
          <DialogDescription>
            Update staff profile details and archive access.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`fullName-${user.id}`}>Full name</Label>
              <Input
                id={`fullName-${user.id}`}
                name="fullName"
                defaultValue={user.fullName}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`pjNumber-${user.id}`}>PJ Number</Label>
              <Input
                id={`pjNumber-${user.id}`}
                name="pjNumber"
                defaultValue={user.pjNumber ?? ""}
                placeholder="80602"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`department-${user.id}`}>Department</Label>
              <Input
                id={`department-${user.id}`}
                name="department"
                defaultValue={user.department ?? ""}
                placeholder="ICT"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Role</Label>
              <Select
                value={role}
                disabled={pending}
                onValueChange={(value) => setRole(value as UserProfile["role"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ROLE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <AsyncButton pending={pending} pendingLabel="Saving" type="submit">
              Save changes
            </AsyncButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
