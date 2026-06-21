"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { checkoutSchema, type CheckoutInput } from "@/contracts";
import { checkoutFile } from "@/app/actions/tracking";
import { AsyncButton } from "@/components/shared/async-button";
import { FieldErrorText, FormError } from "@/components/shared/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CheckoutForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
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
      startTransition(() => router.refresh());
    } catch {
      setError("Unable to check out the file. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="caseNumber">Case number</Label>
        <Input id="caseNumber" placeholder="e.g. HCCR/123/2025" {...register("caseNumber")} />
        <FieldErrorText message={errors.caseNumber?.message} />
      </div>

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
