"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState, type FormEvent } from "react";
import { createUser, deleteUser, updateUserDetails, updateUserRole } from "@/app/actions/users";
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
import type { ProfileListItem } from "@/contracts/users";
import type { CourtUserRole } from "@/types/database";
import { ROLE_LABELS, USER_ROLES } from "@/types/roles";

/** Format a date string safely — returns a fallback if the value is empty or invalid. */
function safeFormatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

const ROLE_OPTIONS = USER_ROLES.map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

export function UsersTable({ profiles }: { profiles: ProfileListItem[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProfileListItem | null>(null);

  async function handleRoleChange(userId: string, role: CourtUserRole) {
    setPendingId(userId);
    setError(null);
    try {
      const result = await updateUserRole(userId, role);
      if (!result.ok) setError(result.error.message);
      else startTransition(() => router.refresh());
    } catch {
      setError("Unable to update the user role. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingId("create");
    setError(null);
    try {
      const result = await createUser(new FormData(event.currentTarget));
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setCreateOpen(false);
      startTransition(() => router.refresh());
    } catch {
      setError("Unable to create the user. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPendingId(deleteTarget.id);
    setError(null);
    try {
      const result = await deleteUser(deleteTarget.id);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } catch {
      setError("Unable to delete the user. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Create, edit, and remove staff accounts with controlled access.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create user
        </Button>
      </div>

      <FormError message={error} />
      <ResponsiveTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-label">Name</TableHead>
              <TableHead className="text-label">Email</TableHead>
              <TableHead className="text-label">PJ Number</TableHead>
              <TableHead className="text-label">Department</TableHead>
              <TableHead className="text-label">Role</TableHead>
              <TableHead className="text-label">Joined</TableHead>
              <TableHead className="text-right text-label">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.full_name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {profile.email ?? "—"}
                </TableCell>
                <TableCell>{profile.pj_number ?? "—"}</TableCell>
                <TableCell>{profile.department ?? "—"}</TableCell>
                <TableCell>
                  <Select
                    value={profile.role}
                    disabled={pendingId === profile.id}
                    onValueChange={(value) =>
                      handleRoleChange(profile.id, value as CourtUserRole)
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{safeFormatDate(profile.created_at)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <EditProfileDialog
                      profile={profile}
                      pending={pendingId === profile.id}
                      onPendingChange={setPendingId}
                      onError={setError}
                      onUpdated={() => router.refresh()}
                    />
                    <Button
                      aria-label={`Delete ${profile.full_name ?? "user"}`}
                      disabled={pendingId === profile.id}
                      size="icon-sm"
                      variant="destructive"
                      onClick={() => setDeleteTarget(profile)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ResponsiveTableShell>

      <CreateUserDialog
        open={createOpen}
        pending={pendingId === "create"}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
      <DeleteUserDialog
        open={deleteTarget !== null}
        pending={deleteTarget ? pendingId === deleteTarget.id : false}
        profile={deleteTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function CreateUserDialog({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const [role, setRole] = useState<CourtUserRole>("registry_clerk");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Provision a new staff account with an auth login and archive role.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="hidden" name="role" value={role} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="create-fullName">Full name</Label>
              <Input id="create-fullName" name="fullName" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                name="email"
                placeholder="user@court.go.ke"
                type="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Temporary password</Label>
              <Input id="create-password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-pjNumber">PJ Number</Label>
              <Input id="create-pjNumber" name="pjNumber" placeholder="80602" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-department">Department</Label>
              <Input id="create-department" name="department" placeholder="ICT" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(value) => value && setRole(value as CourtUserRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <AsyncButton
              pending={pending}
              pendingLabel="Creating"
              type="submit"
            >
              Create user
            </AsyncButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  open,
  pending,
  profile,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  pending: boolean;
  profile: ProfileListItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete user</DialogTitle>
          <DialogDescription>
            {profile ? (
              <>
                Remove <span className="font-medium text-foreground">{profile.full_name}</span>{" "}
                from the system. This deletes their auth account and profile record.
              </>
            ) : (
              "Remove this user from the system."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <AsyncButton pending={pending} pendingLabel="Deleting" type="button" onClick={onConfirm}>
            Delete user
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditProfileDialog({
  profile,
  pending,
  onPendingChange,
  onError,
  onUpdated,
}: {
  profile: ProfileListItem;
  pending: boolean;
  onPendingChange: (id: string | null) => void;
  onError: (message: string | null) => void;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<CourtUserRole>(profile.role);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setRole(profile.role);
    setOpen(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onPendingChange(profile.id);
    onError(null);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("role", role);
      const result = await updateUserDetails(profile.id, formData);
      if (!result.ok) {
        onError(result.error.message);
        return;
      }
      setOpen(false);
      startTransition(() => onUpdated());
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
            aria-label={`Edit ${profile.full_name ?? "user"}`}
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
          <DialogDescription>Update archive system profile details and access role.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`fullName-${profile.id}`}>Full name</Label>
              <Input
                id={`fullName-${profile.id}`}
                name="fullName"
                defaultValue={profile.full_name ?? ""}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`email-${profile.id}`}>
                Email <span className="text-muted-foreground">(auth)</span>
              </Label>
              <Input
                id={`email-${profile.id}`}
                name="email"
                type="email"
                defaultValue={profile.email ?? ""}
                placeholder="user@court.go.ke"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`pjNumber-${profile.id}`}>PJ Number</Label>
              <Input
                id={`pjNumber-${profile.id}`}
                name="pjNumber"
                defaultValue={profile.pj_number ?? ""}
                placeholder="80602"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`department-${profile.id}`}>Department</Label>
              <Input
                id={`department-${profile.id}`}
                name="department"
                defaultValue={profile.department ?? ""}
                placeholder="ICT"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Role</Label>
              <Select
                value={role}
                disabled={pending}
                  onValueChange={(value) => value && setRole(value as CourtUserRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
