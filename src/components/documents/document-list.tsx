"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import {
  deleteDocument,
  getDocumentDownloadUrl,
} from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/shared/form-error";
import { ResponsiveTableShell } from "@/components/shared/responsive-table-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DocumentRow } from "@/types/database";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({
  documents,
  caseId,
  canDelete,
}: {
  documents: DocumentRow[];
  caseId: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(documentId: string) {
    setLoadingId(documentId);
    setError(null);
    try {
      const result = await getDocumentDownloadUrl(documentId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      window.open(result.data.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Unable to open the document. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(documentId: string) {
    if (!confirm("Delete this document permanently?")) return;
    setLoadingId(documentId);
    setError(null);
    try {
      const result = await deleteDocument(documentId, caseId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Unable to delete the document. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      <FormError message={error} />
      <ResponsiveTableShell>
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.title}</TableCell>
              <TableCell>{doc.mime_type}</TableCell>
              <TableCell>{formatSize(doc.file_size)}</TableCell>
              <TableCell>
                {new Date(doc.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loadingId === doc.id}
                    onClick={() => handleDownload(doc.id)}
                  >
                    View
                  </Button>
                  {canDelete && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={loadingId === doc.id}
                      onClick={() => handleDelete(doc.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </ResponsiveTableShell>
    </div>
  );
}
