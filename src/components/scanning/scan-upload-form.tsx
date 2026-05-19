"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { scanRegistrationSchema, type ScanRegistrationInput } from "@/contracts";
import { uploadDocument } from "@/app/actions/scanning";
import { AsyncButton } from "@/components/shared/async-button";
import { FieldErrorText, FormError } from "@/components/shared/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOCUMENT_CATEGORIES } from "@/types/document";

export function ScanUploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScanRegistrationInput>({
    resolver: zodResolver(scanRegistrationSchema),
    defaultValues: {
      caseNumber: "",
      title: "",
      category: "Pleadings",
    },
  });

  async function onSubmit(values: ScanRegistrationInput) {
    setError(null);
    try {
      const result = await uploadDocument(values);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      reset();
      router.refresh();
    } catch {
      setError("Unable to register the scan. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="caseNumber">Case number</Label>
        <Input id="caseNumber" placeholder="e.g. CR/123/2025" {...register("caseNumber")} />
        <FieldErrorText message={errors.caseNumber?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Document title</Label>
        <Input id="title" placeholder="e.g. Charge Sheet" {...register("title")} />
        <FieldErrorText message={errors.title?.message} />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          defaultValue="Pleadings"
          onValueChange={(v) => setValue("category", v as ScanRegistrationInput["category"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File (PDF or image)</Label>
        <Input id="file" type="file" accept=".pdf,image/*" disabled />
        <p className="text-xs text-muted-foreground">
          File upload is simulated in demo mode. Metadata is recorded in the archive index.
        </p>
      </div>

      <FormError message={error} />

      <AsyncButton type="submit" pending={isSubmitting} pendingLabel="Uploading...">
        Register scan
      </AsyncButton>
    </form>
  );
}
