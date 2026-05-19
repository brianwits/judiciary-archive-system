import { z } from "zod";
import { MOVEMENT_STATUSES } from "@/types/movement";

export const movementStatusSchema = z.enum(MOVEMENT_STATUSES);

export const checkoutSchema = z.object({
  caseNumber: z.string().trim().min(1, "Case number is required"),
  destinationOffice: z.string().trim().min(1, "Destination is required"),
  purpose: z.string().trim().min(1, "Purpose is required"),
  expectedReturnDate: z.string().trim().min(1, "Expected return date is required"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
