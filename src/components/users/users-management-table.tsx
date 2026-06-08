"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState, type FormEvent } from "react";
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

const PAGE_SIZE = 10;

export function UsersManagementTable({ users }: { users: UserProfile[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pageUsers = users.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Clamp page when users change (e.g. after refresh or role update)
  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, Math.ceil(users.length / PAGE_SIZE) - 1))); // eslint-disable-line react-hooks/set-state-in-effect
  }, [users.length]);

  async function handleRoleChange(userId: string, role: string) {
    setPendingId(userId);
    setError(null);
    try {
      const result = await updateMockUserRole(userId, role);
      if (!result.ok) setError(result.error.message);
      else startTransition(() => router.refresh());
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
            {pageUsers.map((user) => (
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
                  <Button
                    aria-label={`Edit ${user.fullName}`}
                    size="icon-sm"
                    variant="outline"
                    onClick={() => setEditingUser(user)}
                  >
                    <Pencil />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTableShell>

      {/* Client-side pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, users.length)} of {users.length} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Single shared edit dialog — mounted always, renders content only when open */}
      <SingleEditUserDialog
        user={editingUser}
        onClose={() => setEditingUser(null)}
        pending={editingUser ? pendingId === editingUser.id : false}
        onPendingChange={setPendingId}
        onError={setError}
        onUpdated={() => router.refresh()}
      />
    </div>
  );
}

function SingleEditUserDialog({
  user,
  onClose,
  pending,
  onPendingChange,
  onError,
  onUpdated,
}: {
  user: UserProfile | null;
  onClose: () => void;
  pending: boolean;
  onPendingChange: (id: string | null) => void;
  onError: (message: string | null) => void;
  onUpdated: () => void;
}) {
  const [role, setRole] = useState<string>("");
  const open = user !== null;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) onClose();
  }

  // Sync role state when editing a different user — the dialog stays mounted
  // for close animation continuity, so we update state via effect when the
  // target user changes.
  useEffect(() => {
    if (user) setRole(user.role); // eslint-disable-line react-hooks/set-state-in-effect
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
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
      onClose();
      startTransition(() => onUpdated());
    } catch {
      onError("Unable to update the user details. Please try again.");
    } finally {
      onPendingChange(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit user details</DialogTitle>
          <DialogDescription>
            {user ? `Editing ${user.fullName}` : "Update staff profile details and archive access."}
          </DialogDescription>
        </DialogHeader>
        {user && (
          <form key={user.id} className="space-y-4" onSubmit={handleSubmit}>
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`email-${user.id}`}>
                Email <span className="text-muted-foreground">(auth)</span>
              </Label>
              <Input
                id={`email-${user.id}`}
                name="email"
                type="email"
                defaultValue={user.email}
                placeholder="user@court.go.ke"
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <AsyncButton pending={pending} pendingLabel="Saving" type="submit">
                Save changes
              </AsyncButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
