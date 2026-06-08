"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showDetails = process.env.NODE_ENV !== "production";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          The archive workspace could not load this view. Try again or return to another section.
        </p>
        {showDetails && error.message ? (
          <p className="max-w-2xl break-words rounded-md bg-muted px-3 py-2 font-mono text-left text-xs text-muted-foreground">
            {error.message}
          </p>
        ) : null}
      </div>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
