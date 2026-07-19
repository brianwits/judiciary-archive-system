"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, FolderKanban, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { checkoutSchema, type CheckoutInput } from "@/contracts";
import { checkoutFile, lookupCheckoutCase } from "@/app/actions/tracking";
import { AsyncButton } from "@/components/shared/async-button";
import { FieldErrorText, FormError } from "@/components/shared/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CheckoutPreview = {
  caseNumber: string;
  title: string;
  caseFamily: string;
  archiveCode: string;
  shelfLocation: string | null;
  courtDivision: string;
};

export function CheckoutForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      caseNumber: "",
      destinationOffice: "",
      purpose: "",
      expectedReturnDate: "",
    },
  });

  async function onSubmit(values: CheckoutInput) {
    setError(null);
    try {
      const result = await checkoutFile(values);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      reset();
      setPreview(null);
      setPreviewError(null);
      startTransition(() => router.refresh());
    } catch {
      setError("Unable to check out the file. Please try again.");
    }
  }

  async function handlePreview() {
    const caseNumber = getValues("caseNumber").trim();
    setPreviewError(null);
    setPreview(null);

    if (!caseNumber) {
      setPreviewError("Enter a case number to preview archive context.");
      return;
    }

    setPreviewPending(true);
    try {
      const result = await lookupCheckoutCase(caseNumber);
      if (!result.ok) {
        setPreviewError(result.error.message);
        return;
      }
      setPreview(result.data);
    } catch {
      setPreviewError("Unable to load archive context. Please try again.");
    } finally {
      setPreviewPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="caseNumber">Case number</Label>
        <Input id="caseNumber" placeholder="e.g. HCCR/123/2025" {...register("caseNumber")} />
        <FieldErrorText message={errors.caseNumber?.message} />
        <div className="pt-1">
          <AsyncButton
            type="button"
            variant="outline"
            pending={previewPending}
            pendingLabel="Loading context..."
            onClick={handlePreview}
          >
            <Search className="size-4" aria-hidden />
            Preview archive context
          </AsyncButton>
        </div>
      </div>

      {preview ? (
        <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{preview.caseNumber}</p>
              <p className="mt-1 text-sm text-muted-foreground">{preview.title}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-xs font-medium">
              <FolderKanban className="size-3.5 text-primary" aria-hidden />
              {preview.caseFamily}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Archive className="size-3.5" aria-hidden />
              <span className="text-foreground">{preview.archiveCode}</span>
            </span>
            {preview.shelfLocation ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden />
                {preview.shelfLocation}
              </span>
            ) : null}
            <span>{preview.courtDivision}</span>
          </div>
        </div>
      ) : null}

      <FormError message={previewError} />

      <div className="space-y-2">
        <Label htmlFor="destinationOffice">Destination office</Label>
        <Input
          id="destinationOffice"
          placeholder="e.g. Judge's Chambers"
          {...register("destinationOffice")}
        />
        <FieldErrorText message={errors.destinationOffice?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose</Label>
        <Textarea id="purpose" rows={2} placeholder="Reason for checkout" {...register("purpose")} />
        <FieldErrorText message={errors.purpose?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedReturnDate">Expected return date</Label>
        <Input id="expectedReturnDate" type="date" {...register("expectedReturnDate")} />
        <FieldErrorText message={errors.expectedReturnDate?.message} />
      </div>

      <FormError message={error} />

      <AsyncButton type="submit" pending={isSubmitting} pendingLabel="Checking out...">
        Check out file
      </AsyncButton>
    </form>
  );
}
