import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ListPaginationProps = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  searchParams?: Record<string, string | undefined>;
};

function buildHref(
  basePath: string,
  page: number,
  searchParams?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function ListPagination({
  basePath,
  page,
  pageSize,
  total,
  searchParams,
}: ListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildHref(basePath, page - 1, searchParams)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Previous
          </Link>
        ) : (
          <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}>
            Previous
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={buildHref(basePath, page + 1, searchParams)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Next
          </Link>
        ) : (
          <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}>
            Next
          </span>
        )}
      </div>
    </div>
  );
}
