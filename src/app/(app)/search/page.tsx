import { Suspense } from "react";
import { SearchResults } from "@/components/search/search-results";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { searchAll } from "@/lib/data";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const results = query ? await searchAll(query) : { cases: [], movements: [] };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search"
        subtitle="Find case files and file movements across the archive system"
      />

      <form action="/search" method="get" className="max-w-xl">
        <label htmlFor="search-q" className="sr-only">
          Search query
        </label>
        <input
          id="search-q"
          name="q"
          defaultValue={query}
          placeholder="Case number, party name, destination office..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </form>

      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <SearchResults query={query} cases={results.cases} movements={results.movements} />
      </Suspense>
    </div>
  );
}
