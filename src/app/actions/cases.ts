"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import {
  actionError,
  actionOk,
  bulkDeleteCasesSchema,
  bulkUpdateCaseStatusSchema,
  caseFormDataToInput,
  caseRowToDto,
  normalizeFieldErrors,
} from "@/contracts";
import { MAX_PAGE_SIZE } from "@/contracts/queries";
import { canEditCases, getSessionProfile } from "@/lib/auth";
import { buildArchiveCode } from "@/lib/archive-code";
import { isMockDataEnabled } from "@/lib/config";
import { recordAuditLog, revalidateCaseMutation } from "@/lib/data/action-helpers";
import { mockStore } from "@/lib/data/mock-store";
import { deleteSessionCase, saveSessionCase } from "@/lib/data/mock-session";
import { getCaseById, getCases } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { CaseFile, CaseStatus, CaseType, CourtDivision, CourtStation } from "@/types/case";

export async function searchCases(query: string) {
  if (isMockDataEnabled()) {
    return getCases({ q: query });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_cases", {
    search_query: query,
    result_limit: MAX_PAGE_SIZE,
    result_offset: 0,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(caseRowToDto);
}

export async function getCase(id: string) {
  if (isMockDataEnabled()) {
    const caseFile = await getCaseById(id);
    if (!caseFile) throw new Error("Case not found.");
    return caseFile;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("cases").select("*").eq("id", id).single();

  if (error) throw new Error(error.message);
  return caseRowToDto(data);
}

export async function createCase(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || !canEditCases(profile.role)) {
    return actionError("FORBIDDEN", "You do not have permission to create cases.");
  }

  let input;
  try {
    input = caseFormDataToInput(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      return actionError(
        "VALIDATION_ERROR",
        "Case number and title are required.",
        normalizeFieldErrors(error.flatten().fieldErrors),
      );
    }
    throw error;
  }

  const mockFields = buildMockCase(input, profile.id);
  let caseId: string;

  if (isMockDataEnabled()) {
    const created = mockStore.createCase(mockFields);
    await saveSessionCase(created);
    caseId = created.id;
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cases")
      .insert({
        case_number: input.caseNumber,
        title: input.title,
        court: input.court,
        status: input.status,
        filed_date: input.filedDate,
        closed_date: input.closedDate,
        description: input.description,
        case_type: mockFields.caseType,
        court_station: mockFields.courtStation,
        court_division: mockFields.courtDivision,
        year: mockFields.year,
        plaintiff: mockFields.plaintiff,
        defendant: mockFields.defendant,
        judge: mockFields.judge,
        archive_code: mockFields.archiveCode,
        qr_barcode: mockFields.qrBarcode,
        notes: mockFields.notes,
        is_missing: mockFields.isMissing,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (error) return actionError("BAD_REQUEST", error.message);
    caseId = data.id;
  }

  await recordAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "case_created",
    entityType: "case",
    entityId: caseId,
    description: `Created case ${input.caseNumber}`,
    metadata: { caseNumber: input.caseNumber },
  });

  revalidateCaseMutation(caseId);
  redirect(`/cases/${caseId}`);
}

export async function updateCase(id: string, formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || !canEditCases(profile.role)) {
    return actionError("FORBIDDEN", "You do not have permission to update cases.");
  }

  let input;
  try {
    input = caseFormDataToInput(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      return actionError(
        "VALIDATION_ERROR",
        "Case number and title are required.",
        normalizeFieldErrors(error.flatten().fieldErrors),
      );
    }
    throw error;
  }

  const mockFields = buildMockCase(input, profile.id);

  if (isMockDataEnabled()) {
    const updated = mockStore.updateCase(id, mockFields);
    if (!updated) return actionError("NOT_FOUND", "Case not found.");
    await saveSessionCase(updated);
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cases")
      .update({
        case_number: input.caseNumber,
        title: input.title,
        court: input.court,
        status: input.status,
        filed_date: input.filedDate,
        closed_date: input.closedDate,
        description: input.description,
        case_type: mockFields.caseType,
        court_station: mockFields.courtStation,
        court_division: mockFields.courtDivision,
        year: mockFields.year,
        plaintiff: mockFields.plaintiff,
        defendant: mockFields.defendant,
        judge: mockFields.judge,
        archive_code: mockFields.archiveCode,
        qr_barcode: mockFields.qrBarcode,
        notes: mockFields.notes,
        is_missing: mockFields.isMissing,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) return actionError("BAD_REQUEST", error.message);
    if (!data) return actionError("NOT_FOUND", "Case not found.");
  }

  await recordAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "case_updated",
    entityType: "case",
    entityId: id,
    description: `Updated case ${input.caseNumber}`,
    metadata: { caseNumber: input.caseNumber },
  });

  revalidateCaseMutation(id);
  return actionOk();
}

export async function bulkUpdateCaseStatus(ids: string[], status: CaseStatus) {
  const profile = await getSessionProfile();
  if (!profile || !canEditCases(profile.role)) {
    return actionError("FORBIDDEN", "You do not have permission to update cases.");
  }

  const parsed = bulkUpdateCaseStatusSchema.safeParse({ ids, status });
  if (!parsed.success) {
    return actionError(
      "VALIDATION_ERROR",
      "Invalid bulk status update.",
      normalizeFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  const failed: string[] = [];
  let updated = 0;

  for (const id of parsed.data.ids) {
    try {
      let caseNumber: string;

      if (isMockDataEnabled()) {
        const existing = mockStore.getCaseById(id);
        if (!existing) {
          failed.push(id);
          continue;
        }
        mockStore.updateCase(id, { status: parsed.data.status });
        await saveSessionCase({ ...existing, status: parsed.data.status });
        caseNumber = existing.caseNumber;
      } else {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from("cases")
          .update({ status: parsed.data.status })
          .eq("id", id)
          .select("case_number")
          .maybeSingle();

        if (error || !data) {
          failed.push(id);
          continue;
        }
        caseNumber = data.case_number;
      }

      await recordAuditLog({
        userId: profile.id,
        userName: profile.fullName,
        action: "case_updated",
        entityType: "case",
        entityId: id,
        description: `Bulk status update: ${caseNumber} → ${parsed.data.status}`,
        metadata: { caseNumber, status: parsed.data.status },
      });
      updated += 1;
    } catch {
      failed.push(id);
    }
  }

  revalidateCaseMutation();
  return actionOk({ updated, failed });
}

export async function bulkDeleteCases(ids: string[]) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return actionError("FORBIDDEN", "Only administrators can delete cases.");
  }

  const parsed = bulkDeleteCasesSchema.safeParse({ ids });
  if (!parsed.success) {
    return actionError(
      "VALIDATION_ERROR",
      "Invalid bulk delete request.",
      normalizeFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  const failed: string[] = [];
  let deleted = 0;

  for (const id of parsed.data.ids) {
    try {
      let caseNumber: string | undefined;

      if (isMockDataEnabled()) {
        const existing = mockStore.getCaseById(id);
        if (!existing) {
          failed.push(id);
          continue;
        }
        caseNumber = existing.caseNumber;
        if (!mockStore.deleteCase(id)) {
          failed.push(id);
          continue;
        }
        await deleteSessionCase(id);
      } else {
        const supabase = await createClient();
        const { data: caseRow } = await supabase
          .from("cases")
          .select("case_number")
          .eq("id", id)
          .maybeSingle();

        if (!caseRow) {
          failed.push(id);
          continue;
        }
        caseNumber = caseRow.case_number;

        const { data: documents } = await supabase
          .from("documents")
          .select("storage_path")
          .eq("case_id", id);

        if (documents?.length) {
          await supabase.storage
            .from("case-documents")
            .remove(documents.map((doc) => doc.storage_path));
        }

        const { error } = await supabase.from("cases").delete().eq("id", id);
        if (error) {
          failed.push(id);
          continue;
        }
      }

      await recordAuditLog({
        userId: profile.id,
        userName: profile.fullName,
        action: "case_deleted",
        entityType: "case",
        entityId: id,
        description: `Bulk delete: ${caseNumber ?? id}`,
        metadata: { caseNumber: caseNumber ?? id },
      });
      deleted += 1;
    } catch {
      failed.push(id);
    }
  }

  revalidateCaseMutation();
  return actionOk({ deleted, failed });
}

export async function deleteCase(id: string) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Only administrators can delete cases.");
  }

  if (isMockDataEnabled()) {
    if (!mockStore.deleteCase(id)) {
      throw new Error("Case not found.");
    }
    await deleteSessionCase(id);
  } else {
    const supabase = await createClient();
    const { data: documents } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("case_id", id);

    if (documents?.length) {
      await supabase.storage
        .from("case-documents")
        .remove(documents.map((doc) => doc.storage_path));
    }

    const { error } = await supabase.from("cases").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  await recordAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "case_deleted",
    entityType: "case",
    entityId: id,
    description: `Deleted case ${id}`,
    metadata: { caseId: id },
  });

  revalidateCaseMutation(id);
  redirect("/");
}

function buildMockCase(input: ReturnType<typeof caseFormDataToInput>, userId: string) {
  const filedDate = input.filedDate ?? null;
  const closedDate = input.closedDate ?? null;
  const notes = input.description ?? null;
  const year = filedDate ? new Date(filedDate).getFullYear() : new Date().getFullYear();
  const caseType = inferCaseType(input.caseNumber);
  const caseNo = input.caseNumber.split("/").at(-1) ?? input.caseNumber;
  const courtStation = normalizeCourtStation(input.court);
  const [plaintiff, defendant] = splitCaseTitle(input.title);

  return {
    caseNumber: input.caseNumber,
    caseType,
    courtStation,
    courtDivision: inferCourtDivision(caseType),
    year,
    plaintiff,
    defendant,
    judge: "",
    status: input.status,
    archiveCode: buildArchiveCode({
      court: courtStation,
      caseType,
      year,
      caseNo,
    }),
    shelfLocation: null,
    locationId: null,
    qrBarcode: `QR-${input.caseNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`,
    filedDate,
    closedDate,
    notes,
    isMissing: false,
    createdBy: userId,
  } satisfies Omit<CaseFile, "id" | "createdAt" | "updatedAt">;
}

function inferCaseType(caseNumber: string): CaseType {
  const prefix = caseNumber.split("/")[0]?.toUpperCase();
  if (prefix === "CR") return "Criminal";
  if (prefix === "ELC") return "ELC";
  if (prefix === "FAM") return "Family";
  if (prefix === "COM") return "Commercial";
  if (prefix === "CON") return "Constitutional";
  if (prefix === "PRO") return "Probate";
  return "Civil";
}

function inferCourtDivision(caseType: CaseType): CourtDivision {
  if (caseType === "ELC") return "Environment & Land";
  if (caseType === "Family") return "Family Division";
  if (caseType === "Commercial") return "Commercial Division";
  return "High Court";
}

function normalizeCourtStation(court: string): CourtStation {
  const normalized = court.trim().toUpperCase();
  if (["KBT", "NRB", "MSA", "KSM", "NKR"].includes(normalized)) {
    return normalized as CourtStation;
  }
  return "KBT";
}

function splitCaseTitle(title: string) {
  const match = title.split(/\s+v\.?\s+/i);
  if (match.length >= 2) return [match[0], match.slice(1).join(" v. ")];
  return [title, "Unknown party"];
}
