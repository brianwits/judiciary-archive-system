"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { format } from "date-fns";
import { checkinFile } from "@/app/actions/tracking";
import { AsyncButton } from "@/components/shared/async-button";
import { FormError } from "@/components/shared/form-error";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OpenMovementOption } from "@/types/movement";

type CheckinFormProps = {
  openMovements: OpenMovementOption[];
};

export function CheckinForm({ openMovements }: CheckinFormProps) {
  const router = useRouter();
  const [movementId, setMovementId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCheckin() {
    if (!movementId) {
      setError("Select a file to check in.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await checkinFile(movementId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setMovementId("");
      startTransition(() => router.refresh());
    } catch {
      setError("Unable to check in the file. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Outstanding checkout</Label>
        <Select value={movementId} onValueChange={(v) => setMovementId(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Select case to return" />
          </SelectTrigger>
          <SelectContent>
            {openMovements.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.caseNumber} — {m.caseFamily} — {m.destinationOffice}
                {m.isOverdue ? " — Overdue" : ` — Due ${format(new Date(m.expectedReturnDate), "d MMM")}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FormError message={error} />

      <AsyncButton
        onClick={handleCheckin}
        pending={pending}
        pendingLabel="Checking in..."
        disabled={openMovements.length === 0}
      >
        Check in file
      </AsyncButton>
    </div>
  );
}
