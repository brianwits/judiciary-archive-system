"use server";

import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_FILE_SIZE,
  MAX_DOCUMENT_FILE_SIZE_LABEL,
  actionError,
  actionOk,
} from "@/contracts";
import { canEditCases, getSessionProfile, isAdmin } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { recordAuditLog, revalidateDocumentMutation } from "@/lib/data/action-helpers";
import { mockStore } from "@/lib/data/mock-store";
import { allowRateLimited } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function uploadDocument(caseId: string, formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile || !canEditCases(profile.role)) {
    return actionError("FORBIDDEN", "You do not have permission to upload documents.");
  }

  if (!allowRateLimited(`doc-upload:${profile.id}`, { max: 40, windowMs: 60 * 60_000 })) {
    return actionError("TOO_MANY_REQUESTS", "Too many uploads this hour. Try again later.");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return actionError("VALIDATION_ERROR", "Please select a file to upload.");
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return actionError("VALIDATION_ERROR", `File exceeds the ${MAX_DOCUMENT_FILE_SIZE_LABEL} limit.`);
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_TYPES)[number])) {
    return actionError("VALIDATION_ERROR", "Only PDF and image files are allowed.");
  }

  const title = String(formData.get("title") ?? file.name).trim() || file.name;
  const storagePath = `${caseId}/${crypto.randomUUID()}-${file.name}`;

  let caseNumber: string;

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
    caseNumber = caseFile.caseNumber;
  } else {
    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from("case-documents")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) return actionError("BAD_REQUEST", uploadError.message);

    const { error: insertError } = await supabase
      .from("documents")
      .insert({
        case_id: caseId,
        title,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: profile.id,
      })
      .select("id")
      .single();

    if (insertError) {
      await supabase.storage.from("case-documents").remove([storagePath]);
      return actionError("BAD_REQUEST", insertError.message);
    }

    const { data: caseRow } = await supabase
      .from("cases")
      .select("case_number")
      .eq("id", caseId)
      .maybeSingle();

    caseNumber = caseRow?.case_number ?? caseId;
  }

  await recordAuditLog({
    userId: profile.id,
    userName: profile.fullName,
    action: "document_uploaded",
    entityType: "document",
    entityId: caseId,
    description: `Uploaded ${title} for ${caseNumber}`,
    metadata: { caseNumber, title },
  });

  revalidateDocumentMutation(caseId);
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
    const document = mockStore.getDocumentById(documentId);
    if (!document) return actionError("NOT_FOUND", "Document not found.");
    mockStore.deleteDocument(documentId);
    await recordAuditLog({
      userId: profile.id,
      userName: profile.fullName,
      action: "document_deleted",
      entityType: "document",
      entityId: documentId,
      description: `Deleted ${document.title} from case ${caseId}`,
      metadata: { caseId, title: document.title },
    });
  } else {
    const supabase = await createClient();
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("storage_path, title")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return actionError("NOT_FOUND", "Document not found.");
    }

    await supabase.storage.from("case-documents").remove([document.storage_path]);

    const { error } = await supabase.from("documents").delete().eq("id", documentId);
    if (error) return actionError("BAD_REQUEST", error.message);

    await recordAuditLog({
      userId: profile.id,
      userName: profile.fullName,
      action: "document_deleted",
      entityType: "document",
      entityId: documentId,
      description: `Deleted ${document.title} from case ${caseId}`,
      metadata: { caseId, title: document.title },
    });
  }

  revalidateDocumentMutation(caseId);
  return actionOk();
}
