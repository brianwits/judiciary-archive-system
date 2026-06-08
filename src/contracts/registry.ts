import { z } from "zod";
import type { RegistryRequest } from "@/types/dashboard";

export const REGISTRY_REQUEST_TYPES = [
  "Certified Copy",
  "File Inspection",
  "Archive Retrieval",
  "Party Search",
  "Extension",
  "Destruction",
] as const;

export type RegistryRequestType = (typeof REGISTRY_REQUEST_TYPES)[number];

export const REGISTRY_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "rejected",
] as const satisfies readonly RegistryRequest["status"][];

export const createRegistryRequestSchema = z.object({
  caseNumber: z.string().trim().min(1, "Case number is required."),
  requestType: z.enum(REGISTRY_REQUEST_TYPES),
  requester: z.string().trim().min(1, "Requester name is required."),
});

export const updateRegistryStatusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(REGISTRY_STATUSES),
});

export type CreateRegistryRequestInput = z.infer<typeof createRegistryRequestSchema>;
export type UpdateRegistryStatusInput = z.infer<typeof updateRegistryStatusSchema>;
