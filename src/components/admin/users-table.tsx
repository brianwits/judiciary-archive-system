"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateUserDetails, updateUserRole } from "@/app/actions/users";
import { FormError } from "@/components/shared/form-error";
import { AsyncButton } from "@/components/shared/async-button";
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
import type { ProfileRow, UserRole } from "@/types/database";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "readonly", label: "Read-only" },
];

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
              <TableHead>PJ Number</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">
                  {profile.full_name ?? "—"}
                </TableCell>
                <TableCell>{profile.pj_number ?? "—"}</TableCell>
                <TableCell>{profile.department ?? "—"}</TableCell>
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
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <EditProfileDialog
                    profile={profile}
                    pending={pendingId === profile.id}
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

function EditProfileDialog({
  profile,
  pending,
  onPendingChange,
  onError,
  onUpdated,
}: {
  profile: ProfileRow;
  pending: boolean;
  onPendingChange: (id: string | null) => void;
  onError: (message: string | null) => void;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(profile.role);

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
          <DialogDescription>
            Update archive system profile details and access role.
          </DialogDescription>
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
                onValueChange={(value) => setRole(value as UserRole)}
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
