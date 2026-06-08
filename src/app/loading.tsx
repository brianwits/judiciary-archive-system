import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navigation bar skeleton */}
      <header className="flex h-16 items-center gap-4 border-b px-6">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-5 w-40" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </header>
      {/* Main content area */}
      <div className="flex flex-1">
        {/* Sidebar skeleton */}
        <aside className="hidden w-64 flex-col gap-2 border-r p-4 lg:flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </aside>
        {/* Content skeleton */}
        <main className="flex-1 p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-3xl" />
            ))}
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Skeleton className="h-[320px] w-full rounded-3xl" />
            <Skeleton className="h-[320px] w-full rounded-3xl" />
          </div>
        </main>
      </div>
    </div>
  );
}
