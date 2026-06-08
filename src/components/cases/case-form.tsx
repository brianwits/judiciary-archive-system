"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { createCase, updateCase } from "@/app/actions/cases";
import { AsyncButton } from "@/components/shared/async-button";
import { FormError } from "@/components/shared/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CaseRow } from "@/types/database";

type CaseFormProps = {
  mode: "create" | "edit";
  initial?: CaseRow;
};

export function CaseForm({ mode, initial }: CaseFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState(initial?.status ?? "open");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setSuccess(false);
    formData.set("status", status);

    try {
      const result =
        mode === "create"
          ? await createCase(formData)
          : await updateCase(initial!.id, formData);

      if (result && !result.ok) {
        setError(result.error.message);
        return;
      }

      if (mode === "edit") {
        setSuccess(true);
      }
    } catch (error: unknown) {
      unstable_rethrow(error);
      setError("Unable to save the case. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="case_number">Case number</Label>
          <Input
            id="case_number"
            name="case_number"
            defaultValue={initial?.case_number}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="court">Court</Label>
          <Input id="court" name="court" defaultValue={initial?.court ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={initial?.title} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filed_date">Filed date</Label>
          <Input
            id="filed_date"
            name="filed_date"
            type="date"
            defaultValue={initial?.filed_date ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closed_date">Closed date</Label>
          <Input
            id="closed_date"
            name="closed_date"
            type="date"
            defaultValue={initial?.closed_date ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial?.description ?? ""}
        />
      </div>

      <FormError message={error} />
      {success && (
        <p className="text-sm text-green-600" role="status">
          Case updated successfully.
        </p>
      )}

      <AsyncButton type="submit" pending={pending} pendingLabel="Saving...">
        {mode === "create" ? "Create case" : "Save changes"}
      </AsyncButton>
    </form>
  );
}
