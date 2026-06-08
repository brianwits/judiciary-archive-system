import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Shown under the subtitle — e.g. last-updated stamp or breadcrumbs */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, meta, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 space-y-1.5">
        <h1 className="font-serif text-balance text-2xl font-semibold tracking-tight text-foreground md:text-4xl md:tracking-tighter">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
        {meta ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {meta}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
