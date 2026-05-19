import Link from "next/link";
import { Suspense } from "react";
import { CaseFilters } from "@/components/cases/case-filters";
import { CasesDataTable } from "@/components/cases/cases-data-table";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCases } from "@/lib/data";
import type { CaseFilters as CaseFiltersType, CaseStatus, CaseType } from "@/types/case";

type CasesPageProps = {
  searchParams: Promise<{
    q?: string;
    caseType?: string;
    year?: string;
    status?: string;
  }>;
};

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const params = await searchParams;
  const filters: CaseFiltersType = {};

  if (params.q) filters.q = params.q;
  if (params.caseType) filters.caseType = params.caseType as CaseType;
  if (params.year) filters.year = Number(params.year);
  if (params.status) filters.status = params.status as CaseStatus;

  const cases = await getCases(filters);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Cases"
        subtitle={`${cases.length} case file${cases.length === 1 ? "" : "s"} in the archive`}
        actions={
          <Link href="/cases/new" className={buttonVariants({ size: "sm" })}>
            Register new case
          </Link>
        }
      />

      <Suspense fallback={<Skeleton className="h-20 w-full" />}>
        <CaseFilters />
      </Suspense>

      <CasesDataTable cases={cases} />
    </div>
  );
}
