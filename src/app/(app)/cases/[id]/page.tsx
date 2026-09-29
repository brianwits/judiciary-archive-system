import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { CaseStatusBadge, MovementStatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { AuditTable } from "@/components/audit/audit-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAuditLogsForCase,
  getCaseById,
  getDocuments,
  getMovementsByCase,
} from "@/lib/data";
import { cn } from "@/lib/utils";

type CaseDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string }>;
};

export default async function CaseDetailPage({ params, searchParams }: CaseDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isFromArchive = resolvedSearchParams?.from === "archive";
  const caseFile = await getCaseById(id);

  if (!caseFile) {
    notFound();
  }

  const [documents, movements, auditLogs] = await Promise.all([
    getDocuments(id),
    getMovementsByCase(id),
    getAuditLogsForCase(id, caseFile.caseNumber),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href={isFromArchive ? "/archive" : "/cases"}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 inline-flex")}
      >
        {isFromArchive ? "← Back to archive" : "← Back to cases"}
      </Link>

      <PageHeader
        title={caseFile.caseNumber}
        subtitle={`${caseFile.plaintiff} v. ${caseFile.defendant}`}
        actions={<CaseStatusBadge status={caseFile.status} />}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="movement">Movement ({movements.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit ({auditLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Case details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Case type:</span> {caseFile.caseTypeFullLabel}
                </p>
                <p>
                  <span className="font-medium">Classification:</span>{" "}
                  {caseFile.classificationStatus.replace("_", " ")}
                </p>
                <p>
                  <span className="font-medium">Division:</span> {caseFile.courtDivision}
                </p>
                <p>
                  <span className="font-medium">Station:</span> {caseFile.courtStation}
                </p>
                <p>
                  <span className="font-medium">Year:</span> {caseFile.year}
                </p>
                <p>
                  <span className="font-medium">Judge:</span> {caseFile.judge}
                </p>
                <p>
                  <span className="font-medium">Filed:</span>{" "}
                  {caseFile.filedDate ?? "—"}
                </p>
                <p>
                  <span className="font-medium">Closed:</span>{" "}
                  {caseFile.closedDate ?? "—"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Archive location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Archive code:</span>{" "}
                  <span className="font-mono">{caseFile.archiveCode}</span>
                </p>
                <p>
                  <span className="font-medium">Shelf:</span>{" "}
                  {caseFile.shelfLocation ?? "—"}
                </p>
                {caseFile.isMissing && (
                  <Badge variant="outline" className="bg-destructive/15 text-destructive">
                    File reported missing
                  </Badge>
                )}
                {caseFile.notes && (
                  <p className="text-muted-foreground">{caseFile.notes}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Scanned and indexed case documents</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents on file.</p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>OCR</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.title}</TableCell>
                          <TableCell>{doc.category}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {doc.ocrStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(doc.createdAt), "d MMM yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>File movement history</CardTitle>
              <CardDescription>Checkouts and returns for this case</CardDescription>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No movements recorded.</p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Destination</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Checked out by</TableHead>
                        <TableHead>Expected return</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.destinationOffice}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.purpose}
                          </TableCell>
                          <TableCell className="text-sm">{m.checkedOutByName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(m.expectedReturnDate), "d MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            <MovementStatusBadge status={m.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit trail</CardTitle>
              <CardDescription>Actions related to this case file</CardDescription>
            </CardHeader>
            <CardContent>
              <AuditTable logs={auditLogs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
