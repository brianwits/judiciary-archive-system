import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CaseFilters } from "@/components/cases/case-filters";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/shared/list-pagination";
import { TablePanelSkeleton } from "@/components/shared/page-skeletons";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE } from "@/contracts/queries";
import { DEFAULT_CASE_PAGE_SIZE, parseCasePageSize } from "@/config/case-pagination";
import { getSessionProfile } from "@/lib/auth";
import { getCasesPage, getDocumentCountsForCases } from "@/lib/data";
import type { CaseFilters as CaseFiltersType, CaseStatus } from "@/types/case";

const DynamicCasesPageClient = dynamic(() => import("@/components/cases/cases-page-client").then((m) => ({ default: m.CasesPageClient })));

type CasesPageProps = {
  searchParams: Promise<{
    q?: string;
    caseTypeId?: string;
    classification?: string;
    courtDivision?: string;
    year?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const params = await searchParams;
  const filters: CaseFiltersType = {};
  const page = Math.max(Number(params.page) || DEFAULT_PAGE, 1);
  const pageSize = parseCasePageSize(params.pageSize);

  if (params.q) filters.q = params.q;
  if (params.caseTypeId) filters.caseTypeId = Number(params.caseTypeId);
  if (["canonical", "legacy", "pending_review"].includes(params.classification ?? "")) {
    filters.classificationStatus = params.classification as CaseFiltersType["classificationStatus"];
  }
  if (
    ["High Court", "Magistrate Court", "Environment & Land", "Commercial Division"].includes(
      params.courtDivision ?? "",
    )
  ) {
    filters.courtDivision = params.courtDivision as CaseFiltersType["courtDivision"];
  }
  if (params.year) filters.year = Number(params.year);
  if (params.status) filters.status = params.status as CaseStatus;

  const [result, profile] = await Promise.all([
    getCasesPage(filters, { page, pageSize }),
    getSessionProfile(),
  ]);

  // Batch-load documents for all cases on this page in a single round-trip
  // (eliminates N+1 doc fetches when showing document counts per case)
  const caseIds = result.items.map((c) => c.id);
  const docCountByCaseId: Record<string, number> =
    caseIds.length > 0
      ? Object.fromEntries(
          Array.from((await getDocumentCountsForCases(caseIds)).entries()),
        )
      : {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Court Case Files"
        subtitle={`${result.total.toLocaleString()} case file${result.total === 1 ? "" : "s"} across High Court, Magistrate Court, ELC, and related court divisions`}
        actions={
          <Link href="/cases/new" className={buttonVariants({ size: "sm" })}>
            Register new case
          </Link>
        }
      />

      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <CaseFilters />
      </Suspense>

      <Suspense fallback={<TablePanelSkeleton rows={8} />}>
        <DynamicCasesPageClient
          key={[
            result.page,
            params.q,
            params.caseTypeId,
            params.classification,
            params.courtDivision,
            params.year,
            params.status,
            pageSize,
          ].join("-")}
          cases={result.items}
          docCountByCaseId={docCountByCaseId}
          role={profile!.role}
        />
      </Suspense>

      <ListPagination
        basePath="/cases"
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        searchParams={{
          q: params.q,
          caseTypeId: params.caseTypeId,
          classification: params.classification,
          courtDivision: params.courtDivision,
          year: params.year,
          status: params.status,
          pageSize: pageSize === DEFAULT_CASE_PAGE_SIZE ? undefined : String(pageSize),
        }}
      />
    </div>
  );
}
