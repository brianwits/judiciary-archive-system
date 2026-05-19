"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import {
  actionError,
  actionOk,
  caseFormDataToInput,
  caseRowToDto,
  normalizeFieldErrors,
} from "@/contracts";
import { canEditCases, getSessionProfile } from "@/lib/auth";
import { buildArchiveCode } from "@/lib/archive-code";
import { isMockDataEnabled } from "@/lib/config";
import { mockStore } from "@/lib/data/mock-store";
import { deleteSessionCase, saveSessionCase } from "@/lib/data/mock-session";
import { createClient } from "@/lib/supabase/server";
import type { CaseFile, CaseType, CourtDivision, CourtStation } from "@/types/case";

export async function searchCases(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_cases", {
    search_query: query,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(caseRowToDto);
}

export async function getCase(id: string) {
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

  if (isMockDataEnabled()) {
    const created = mockStore.createCase(buildMockCase(input, profile.id));
    await saveSessionCase(created);
    revalidatePath("/");
    revalidatePath("/cases");
    redirect(`/cases/${created.id}`);
  }

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
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return actionError("BAD_REQUEST", error.message);

  revalidatePath("/");
  redirect(`/cases/${data.id}`);
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

  if (isMockDataEnabled()) {
    const updated = mockStore.updateCase(id, buildMockCase(input, profile.id)) ?? {
      ...buildMockCase(input, profile.id),
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!updated) return actionError("NOT_FOUND", "Case not found.");
    await saveSessionCase(updated);
    revalidatePath("/");
    revalidatePath("/cases");
    revalidatePath(`/cases/${id}`);
    return actionOk();
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cases")
    .update({
      case_number: input.caseNumber,
      title: input.title,
      court: input.court,
      status: input.status,
      filed_date: input.filedDate,
      closed_date: input.closedDate,
      description: input.description,
    })
    .eq("id", id);

  if (error) return actionError("BAD_REQUEST", error.message);

  revalidatePath("/");
  revalidatePath(`/cases/${id}`);
  return actionOk();
}

export async function deleteCase(id: string) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Only administrators can delete cases.");
  }

  if (isMockDataEnabled()) {
    mockStore.deleteCase(id);
    await deleteSessionCase(id);
    revalidatePath("/");
    revalidatePath("/cases");
    redirect("/");
  }

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

  revalidatePath("/");
  redirect("/");
}

export async function deleteCaseForm(id: string) {
  await deleteCase(id);
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
