import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReportData } from "@/lib/reports-computations";

export function ReportTaxonomyBreakdown({ data }: { data: ReportData }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Case classification</CardTitle>
          <CardDescription>{data.totalCases.toLocaleString()} cases in the selected reporting window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {data.courtLevelStats.map((item) => (
              <div key={item.name} className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">{item.name}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {data.familyStats.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                <span>{item.name}</span>
                <Badge variant="outline">{item.value.toLocaleString()}</Badge>
              </div>
            ))}
          </div>
          {data.unclassifiedCount > 0 ? (
            <p className="rounded-lg bg-warning/15 p-3 text-sm text-warning-foreground">
              {data.unclassifiedCount.toLocaleString()} record{data.unclassifiedCount === 1 ? "" : "s"} require classification review.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed case types</CardTitle>
          <CardDescription>Authoritative type counts, separated by numeric identity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-2">
            {data.caseTypeStats.map((item) => (
              <div key={`${item.caseTypeId ?? "legacy"}-${item.code}-${item.name}`} className="flex items-start justify-between gap-4 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.fullLabel}</p>
                  <p className="text-xs text-muted-foreground">{item.courtLevel} · {item.family}{item.caseTypeId ? ` · ID ${item.caseTypeId}` : ""}</p>
                </div>
                <span className="text-lg font-semibold">{item.value.toLocaleString()}</span>
              </div>
            ))}
            {data.caseTypeStats.length === 0 ? <p className="text-sm text-muted-foreground">No cases match the selected filters.</p> : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
