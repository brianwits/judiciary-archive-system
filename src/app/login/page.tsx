import { Suspense } from "react";
import dynamic from "next/dynamic";

const LoginForm = dynamic(() => import("./login-form"), {
  loading: () => <SignInCardSkeleton />,
});

const COPYRIGHT_YEAR = 2026;

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Static sidebar — server-rendered HTML, zero client JS needed */}
      <div className="hidden flex-1 flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
              aria-hidden="true"
            >
              <path d="M12 3v18" />
              <path d="M5 7c0 1.5.5 3 2 4" />
              <path d="M19 7c0 1.5-.5 3-2 4" />
              <path d="M5 17c0 1.5.5 3 2 4" />
              <path d="M19 17c0 1.5-.5 3-2 4" />
              <path d="M10 21h4" />
              <path d="M10 3h4" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold">Judiciary of Kenya</p>
            <p className="text-sm text-sidebar-foreground/70">Archive Management System</p>
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Secure physical &amp; digital case file archive
          </h1>
          <p className="max-w-md text-sidebar-foreground/80">
            Track file movements, manage archive storage, scan documents, and maintain a
            complete audit trail for court operations.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">
          &copy; {COPYRIGHT_YEAR} Judiciary Archive System
        </p>
      </div>

      {/* Interactive form — loaded dynamically to avoid blocking initial render */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <Suspense fallback={<SignInCardSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

/** Lightweight skeleton shown while the form JS chunk loads. */
function SignInCardSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse" aria-hidden="true">
      <div className="rounded-xl bg-card py-4 shadow-sm ring-1 ring-border/80">
        <div className="space-y-2 px-4">
          <div className="h-5 w-20 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted/60" />
        </div>
        <div className="mt-6 space-y-4 px-4">
          <div className="h-10 w-full rounded-lg bg-muted" />
          <div className="h-10 w-full rounded-lg bg-muted" />
          <div className="h-10 w-full rounded-lg bg-primary/20" />
        </div>
      </div>
    </div>
  );
}
