"use client";

import Link from "next/link";
import {
  ArrowRight,
  Barcode,
  Camera,
  CheckCircle2,
  FileImage,
  FileText,
  Files,
  ScanLine,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  scanCase,
  uploadScannedDocument,
} from "@/app/actions/scanning";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { CaseStatusBadge } from "@/components/shared/status-badge";
import { AsyncButton } from "@/components/shared/async-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Progress,
  ProgressLabel,
} from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_FILE_SIZE,
  MAX_DOCUMENT_FILE_SIZE_LABEL,
} from "@/contracts/documents";
import type { ScanLookupResult } from "@/contracts";
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/types/document";

const MAX_SCAN_FILES = 10;
const FILE_ACCEPT = ALLOWED_DOCUMENT_TYPES.join(",");

const MATCH_LABELS: Record<ScanLookupResult["matchedBy"], string> = {
  case_number: "Case number",
  case_number_alias: "Previous case number",
  qr_barcode: "QR / barcode",
  archive_code: "Archive code",
};

export function ScanningConsole() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanLookupResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await scanCase({ code });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setResult(response.data);
      setCode("");
    } catch {
      setError("Unable to find the case file. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function resetCase() {
    setResult(null);
    setError(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5 text-primary" aria-hidden />
            Find case file
          </CardTitle>
          <CardDescription>
            Enter a case number, QR / barcode, or archive code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scan-code">Case identifier</Label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  id="scan-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="HCCR/123/2025"
                  className="pl-9 font-mono"
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>

            <FormError message={error} />

            <AsyncButton
              type="submit"
              pending={pending}
              pendingLabel="Finding case..."
              className="w-full"
            >
              Find case
            </AsyncButton>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <div className="space-y-6">
          <CaseScanHeader result={result} onReset={resetCase} />
          <DigitalCapturePanel result={result} onUploaded={() => {
            startTransition(() => router.refresh());
          }} />
        </div>
      ) : (
        <EmptyState
          icon={ScanLine}
          title="Select a case to begin"
          description="Find the case record before capturing or uploading its digital documents."
          className="min-h-[28rem]"
        />
      )}
    </div>
  );
}

function CaseScanHeader({
  result,
  onReset,
}: {
  result: ScanLookupResult;
  onReset: () => void;
}) {
  const { caseFile } = result;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{MATCH_LABELS[result.matchedBy]}</Badge>
            <CaseStatusBadge status={caseFile.status} />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Change case
          </Button>
        </div>
        <div>
          <CardTitle className="font-mono text-xl">{caseFile.caseNumber}</CardTitle>
          <CardDescription>
            {caseFile.plaintiff} v. {caseFile.defendant}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <Detail label="Archive code" value={caseFile.archiveCode} mono />
          <Detail label="Division" value={caseFile.courtDivision} />
          <Detail label="Case type" value={caseFile.caseTypeFullLabel} />
          <Detail label="Family" value={caseFile.caseFamily} />
        </div>
        <Link
          href={`/cases/${caseFile.id}`}
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          Open case
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}

function DigitalCapturePanel({
  result,
  onUploaded,
}: {
  result: ScanLookupResult;
  onUploaded: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("Pleadings");
  const [pending, setPending] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;

    setError(null);
    setSuccess(null);
    const accepted = Array.from(incoming).filter((file) => {
      if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_TYPES)[number])) {
        setError("Only PDF, JPG, PNG, and WebP files can be digitized.");
        return false;
      }
      if (file.size > MAX_DOCUMENT_FILE_SIZE) {
        setError(`${file.name} exceeds the ${MAX_DOCUMENT_FILE_SIZE_LABEL} limit.`);
        return false;
      }
      return true;
    });

    setFiles((current) => {
      const combined = [...current];
      for (const file of accepted) {
        const duplicate = combined.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        );
        if (!duplicate && combined.length < MAX_SCAN_FILES) combined.push(file);
      }
      if (current.length + accepted.length > MAX_SCAN_FILES) {
        setError(`A digital scan can contain up to ${MAX_SCAN_FILES} files.`);
      }
      return combined;
    });
  }

  async function uploadBatch() {
    if (files.length === 0) {
      setError("Capture or select at least one document.");
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);
    setUploadedCount(0);

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const baseTitle = title.trim() || file.name.replace(/\.[^.]+$/, "");
      const documentTitle = files.length > 1
        ? `${baseTitle} - ${String(index + 1).padStart(2, "0")}`
        : baseTitle;
      const formData = new FormData();
      formData.set("file", file);
      formData.set("title", documentTitle);
      formData.set("category", category);

      try {
        const response = await uploadScannedDocument(result.caseFile.id, formData);
        if (!response.ok) {
          setFiles((current) => current.slice(index));
          setError(`${file.name}: ${response.error.message}`);
          setPending(false);
          return;
        }
      } catch {
        setFiles((current) => current.slice(index));
        setError(`${file.name}: upload failed. Please try again.`);
        setPending(false);
        return;
      }

      setUploadedCount(index + 1);
    }

    const count = files.length;
    setFiles([]);
    setTitle("");
    setPending(false);
    setSuccess(`${count} ${count === 1 ? "document" : "documents"} digitized successfully.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    onUploaded();
  }

  const progress = files.length > 0 ? Math.round((uploadedCount / files.length) * 100) : 0;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="size-5 text-primary" aria-hidden />
          Capture documents
        </CardTitle>
        <CardDescription>
          PDF or image files, up to {MAX_DOCUMENT_FILE_SIZE_LABEL} each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-20 flex-col gap-2"
            disabled={pending}
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="size-5" aria-hidden />
            Capture with camera
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-20 flex-col gap-2"
            disabled={pending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Files className="size-5" aria-hidden />
            Select scanned files
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            aria-label="Capture document with camera"
            onChange={(event) => addFiles(event.target.files)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_ACCEPT}
            multiple
            className="sr-only"
            aria-label="Select scanned document files"
            onChange={(event) => addFiles(event.target.files)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scan-title">Document title</Label>
            <Input
              id="scan-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Witness statements"
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scan-category">Document category</Label>
            <Select
              value={category}
              onValueChange={(value) => value && setCategory(value as DocumentCategory)}
              disabled={pending}
            >
              <SelectTrigger id="scan-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {files.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="font-medium">Scan queue ({files.length})</p>
              <p className="text-muted-foreground">{formatFileSize(totalSize)}</p>
            </div>
            <div className="max-h-64 divide-y overflow-y-auto rounded-lg border">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${file.size}`}
                  className="flex min-w-0 items-center gap-3 p-3"
                >
                  {file.type === "application/pdf" ? (
                    <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <FileImage className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  {uploadedCount > index ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-label="Uploaded" />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      aria-label={`Remove ${file.name}`}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {pending ? (
          <Progress value={progress}>
            <ProgressLabel>Digitizing documents</ProgressLabel>
            <span className="ml-auto text-sm tabular-nums text-muted-foreground">
              {uploadedCount} of {files.length}
            </span>
          </Progress>
        ) : null}

        <FormError message={error} />
        {success ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300"
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            {success}
          </div>
        ) : null}

        <AsyncButton
          type="button"
          pending={pending}
          pendingLabel={`Digitizing ${uploadedCount + 1} of ${files.length}...`}
          disabled={files.length === 0}
          onClick={uploadBatch}
          className="w-full sm:w-auto"
        >
          <Upload className="size-4" aria-hidden />
          Digitize {files.length > 0 ? `${files.length} ${files.length === 1 ? "document" : "documents"}` : "documents"}
        </AsyncButton>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-medium", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
