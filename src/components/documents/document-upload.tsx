"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { uploadDocument } from "@/app/actions/documents";
import { AsyncButton } from "@/components/shared/async-button";
import { FormError } from "@/components/shared/form-error";
import { MAX_DOCUMENT_FILE_SIZE_LABEL } from "@/contracts/documents";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DocumentUpload({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await uploadDocument(caseId, formData);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Unable to upload the document. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Document title</Label>
          <Input id="title" name="title" placeholder="e.g. Filing affidavit" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">{`File (PDF or image, max ${MAX_DOCUMENT_FILE_SIZE_LABEL})`}</Label>
          <Input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            required
          />
        </div>
      </div>
      <FormError message={error} />
      <AsyncButton type="submit" pending={pending} pendingLabel="Uploading...">
        Upload document
      </AsyncButton>
    </form>
  );
}
