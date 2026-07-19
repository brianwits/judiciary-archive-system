import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ReportData } from "@/lib/reports-computations";

const COURT_COLORS: Record<string, string> = {
  "High Court": "border-l-primary",
  "Magistrate Court": "border-l-accent",
  "Environment and Land Court": "border-l-[#235789]",
};

function CourtBadge({ court }: { court: string }) {
  const colors: Record<string, string> = {
    "High Court": "bg-primary/10 text-primary",
    "Magistrate Court": "bg-accent/15 text-accent-foreground",
    "Environment and Land Court": "bg-[#235789]/10 text-[#235789]",
  };
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-tight", colors[court] ?? "bg-muted text-muted-foreground")}>
      {court === "Environment and Land Court" ? "ELC" : court === "Magistrate Court" ? "Mag." : "H.C."}
    </span>
  );
}

export function ReportTaxonomyBreakdown({ data }: { data: ReportData }) {
  // Build a court × category matrix
  const courtLevels = data.courtLevelStats.map((c) => c.name);
  const categoryNames = [...new Set(data.caseCategoryStats.map((c) => c.categoryName))];
  const matrix = categoryNames.map((catName) => {
    const row: Record<string, number | string> = { category: catName };
    for (const cl of courtLevels) {
      const match = data.caseCategoryStats.find(
        (cc) => cc.categoryName === catName && cc.courtLevel === cl,
      );
      row[cl] = match?.value ?? 0;
    }
    row.total = Object.values(row).filter((v): v is number => typeof v === "number").reduce((a, b) => a + b, 0);
    return row;
  });
  matrix.sort((a, b) => (b.total as number) - (a.total as number));

  return (
    <section className="space-y-6">
      {/* Row 1: court level distribution + Category × Court matrix */}
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Court-level distribution</CardTitle>
            <CardDescription>
              {data.totalCases.toLocaleString()} cases across {courtLevels.length} court levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.courtLevelStats.map((item) => (
                <div
                  key={item.name}
                  className={cn(
                    "rounded-xl border border-l-4 p-4",
                    COURT_COLORS[item.name] ?? "border-l-muted",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">{item.name}</p>
                    <CourtBadge court={item.name} />
                  </div>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.totalCases > 0
                      ? `${((item.value / data.totalCases) * 100).toFixed(1)}% of total`
                      : "—"}
                  </p>
                </div>
              ))}
            </div>

            {data.unclassifiedCount > 0 && (
              <p className="rounded-lg bg-warning/15 p-3 text-sm text-warning-foreground">
                {data.unclassifiedCount.toLocaleString()} record{data.unclassifiedCount === 1 ? "" : "s"}{" "}
                require classification review.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Court × Category Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Category × Court matrix</CardTitle>
            <CardDescription>
              All case categories from Magistrate, High Court &amp; ELC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[580px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="sticky top-0 bg-card pb-2 pr-3">Category</th>
                    {courtLevels.map((cl) => (
                      <th key={cl} className="sticky top-0 bg-card pb-2 pr-3 text-right">
                        {cl === "Environment and Land Court" ? "ELC" : cl === "Magistrate Court" ? "Mag." : "H.C."}
                      </th>
                    ))}
                    <th className="sticky top-0 bg-card pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.length === 0 ? (
                    <tr>
                      <td colSpan={courtLevels.length + 2} className="py-8 text-center text-sm text-muted-foreground">
                        No category data available for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    matrix.map((row) => (
                      <tr key={row.category as string} className="border-b border-border/40 transition-colors hover:bg-muted/30">
                        <td className="py-2.5 pr-3 text-sm font-medium">{row.category as string}</td>
                        {courtLevels.map((cl) => (
                          <td key={cl} className="py-2.5 pr-3 text-right text-sm tabular-nums">
                            {(row[cl] as number) > 0 ? (row[cl] as number).toLocaleString() : "—"}
                          </td>
                        ))}
                        <td className="py-2.5 text-right text-sm font-semibold tabular-nums">
                          {(row.total as number).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Detailed case types */}
      <Card>
        <CardHeader>
          <CardTitle>Authoritative case types</CardTitle>
          <CardDescription>
            All case types from Magistrate, High Court &amp; ELC — grouped by numeric identity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[480px] space-y-2 overflow-y-auto pr-2">
            {data.caseTypeStats.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No cases match the selected filters.
              </p>
            ) : (
              data.caseTypeStats.map((item) => (
                <div
                  key={`${item.caseTypeId ?? "legacy"}-${item.code}-${item.name}`}
                  className={cn(
                    "flex items-start justify-between gap-4 rounded-xl border p-3 transition-colors hover:bg-muted/20",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{item.fullLabel}</p>
                      <CourtBadge court={item.courtLevel} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.caseTypeId ? `Type ID ${item.caseTypeId}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-lg font-semibold tabular-nums">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
