"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ChartReady({
  children,
  className,
  fallback,
}: {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width <= 0 || height <= 0) return false;
      setReady(true);
      return true;
    };

    if (measure()) return;

    const observer = new ResizeObserver((entries) => {
      if (entries.some((entry) => entry.contentRect.width > 0 && entry.contentRect.height > 0)) {
        setReady(true);
        observer.disconnect();
      }
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("size-full min-h-0 min-w-0", className)}>
      {ready ? children : (fallback ?? <Skeleton className="size-full rounded-2xl" />)}
    </div>
  );
}
