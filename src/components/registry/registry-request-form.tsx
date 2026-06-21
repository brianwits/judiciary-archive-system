"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createRegistryRequest } from "@/app/actions/registry";
import { REGISTRY_REQUEST_TYPES } from "@/contracts/registry";
import { AsyncButton } from "@/components/shared/async-button";
import { FormError } from "@/components/shared/form-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RegistryRequestForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [requestType, setRequestType] = useState<string>(REGISTRY_REQUEST_TYPES[0]);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("requestType", requestType);

    const result = await createRegistryRequest(formData);
    setPending(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    toast.success(`Registry request submitted for ${result.data.caseNumber}.`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New registry request</CardTitle>
        <CardDescription>Submit a certified copy, inspection, or retrieval request</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="caseNumber">Case number</Label>
            <Input
              id="caseNumber"
              name="caseNumber"
              placeholder="HCCR/123/2025"
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label>Request type</Label>
            <Select value={requestType} onValueChange={(v) => setRequestType(v ?? REGISTRY_REQUEST_TYPES[0])}>
              <SelectTrigger disabled={pending}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGISTRY_REQUEST_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requester">Requester</Label>
            <Input
              id="requester"
              name="requester"
              placeholder="Adv. Kimani"
              required
              disabled={pending}
            />
          </div>
          <AsyncButton type="submit" pending={pending} pendingLabel="Submitting...">
            Submit request
          </AsyncButton>
          <FormError message={error} />
        </form>
      </CardContent>
    </Card>
  );
}
