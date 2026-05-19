"use server";

import { revalidatePath } from "next/cache";
import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_FILE_SIZE,
  actionError,
  actionOk,
} from "@/contracts";
import { canEditCases, getSessionProfile, isAdmin } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { mockStore } from "@/lib/data/mock-store";
import { createClient } from "@/lib/supabase/server";

export async function getDocuments(caseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function uploadDocument(caseId: string, formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || !canEditCases(profile.role)) {
    return actionError("FORBIDDEN", "You do not have permission to upload documents.");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return actionError("VALIDATION_ERROR", "Please select a file to upload.");
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return actionError("VALIDATION_ERROR", "File exceeds the 25 MB limit.");
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_TYPES)[number])) {
    return actionError("VALIDATION_ERROR", "Only PDF and image files are allowed.");
  }

  const title = String(formData.get("title") ?? file.name).trim() || file.name;
  const storagePath = `${caseId}/${crypto.randomUUID()}-${file.name}`;

  if (isMockDataEnabled()) {
    const caseFile = mockStore.getCaseById(caseId);
    if (!caseFile) return actionError("NOT_FOUND", "Case not found.");
    mockStore.addDocument({
      caseId,
      title,
      category: "Pleadings",
      storagePath,
      mimeType: file.type,
      fileSize: file.size,
      ocrStatus: "pending",
      uploadedBy: profile.id,
      uploadedByName: profile.fullName,
    });
    mockStore.addAuditLog({
      userId: profile.id,
      userName: profile.fullName,
      action: "document_uploaded",
      entityType: "document",
      entityId: storagePath,
      description: `Uploaded ${title} for ${caseFile.caseNumber}`,
      metadata: { caseNumber: caseFile.caseNumber },
    });
    revalidatePath(`/cases/${caseId}`);
    return actionOk();
  }

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("case-documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) return actionError("BAD_REQUEST", uploadError.message);

  const { error: insertError } = await supabase.from("documents").insert({
    case_id: caseId,
    title,
    storage_path: storagePath,
    mime_type: file.type,
    file_size: file.size,
    uploaded_by: profile.id,
  });

  if (insertError) {
    await supabase.storage.from("case-documents").remove([storagePath]);
    return actionError("BAD_REQUEST", insertError.message);
  }

  revalidatePath(`/cases/${caseId}`);
  return actionOk();
}

export async function getDocumentDownloadUrl(documentId: string) {
  if (isMockDataEnabled()) {
    const document = mockStore.getDocumentById(documentId);
    if (!document) return actionError("NOT_FOUND", "Document not found.");
    return actionOk({ url: "#", title: document.title });
  }

  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("documents")
    .select("storage_path, title")
    .eq("id", documentId)
    .single();

  if (error || !document) {
    return actionError("NOT_FOUND", "Document not found.");
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("case-documents")
    .createSignedUrl(document.storage_path, 60);

  if (signError || !signed) {
    return actionError("BAD_REQUEST", signError?.message ?? "Unable to generate download link.");
  }

  return actionOk({ url: signed.signedUrl, title: document.title });
}

export async function deleteDocument(documentId: string, caseId: string) {
  const profile = await getSessionProfile();
  if (!profile || !isAdmin(profile.role)) {
    return actionError("FORBIDDEN", "Only administrators can delete documents.");
  }

  if (isMockDataEnabled()) {
    const deleted = mockStore.deleteDocument(documentId);
    if (!deleted) return actionError("NOT_FOUND", "Document not found.");
    revalidatePath(`/cases/${caseId}`);
    return actionOk();
  }

  const supabase = await createClient();
  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();

  if (fetchError || !document) {
    return actionError("NOT_FOUND", "Document not found.");
  }

  await supabase.storage.from("case-documents").remove([document.storage_path]);

  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) return actionError("BAD_REQUEST", error.message);

  revalidatePath(`/cases/${caseId}`);
  return actionOk();
}
