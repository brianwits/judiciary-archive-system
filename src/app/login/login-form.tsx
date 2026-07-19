"use client";

import { Suspense, startTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { DEMO_PASSWORD, MOCK_USERS } from "@/data/seed/users";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/shared/form-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isMockDataEnabled } from "@/lib/config";

const USE_MOCK = isMockDataEnabled();

/** Local doc reference only (no browser route). Open README.md in the repo editor. */
const README_FIRST_ADMIN = 'README.md — section "First admin user"';

function MissingProfileBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  if (USE_MOCK) return null;
  if (error !== "missing_profile" && error !== "inactive_account") return null;

  if (error === "inactive_account") {
    return (
      <div
        className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground"
        role="alert"
      >
        <p className="font-medium">Account deactivated</p>
        <p className="mt-1 text-muted-foreground">
          Your staff profile exists, but it is marked inactive in{" "}
          <span className="rounded bg-muted px-1 py-0.5 font-mono text-xs">profiles</span>.
          Contact an administrator to reactivate the account.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground"
      role="alert"
    >
      <p className="font-medium">Account not linked to staff profiles</p>
      <p className="mt-1 text-muted-foreground">
        You are signed in to Supabase Auth, but there is no matching row in{" "}
        <span className="rounded bg-muted px-1 py-0.5 font-mono text-xs">profiles</span>. Run{" "}
        <span className="rounded bg-muted px-1 py-0.5 font-mono text-xs">npm run db:seed-users</span>{" "}
        with <span className="rounded bg-muted px-1 py-0.5 font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</span>{" "}
        set, apply migrations (including profile backfills), or ask an administrator to provision your
        profile. See <span className="font-medium text-foreground">{README_FIRST_ADMIN}</span>.
      </p>
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState(USE_MOCK ? (MOCK_USERS[0]?.email ?? "") : "");
  const [password, setPassword] = useState(USE_MOCK ? DEMO_PASSWORD : "");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await signIn(formData);
      if (result && !result.ok) {
        setError(result.error.message);
        return;
      }
      startTransition(() => {
        router.replace("/");
        router.refresh();
      });
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function handleMockUser(value: string | null) {
    if (!value) return;
    const user = MOCK_USERS.find((candidate) => candidate.id === value);
    if (!user) return;
    setEmail(user.email);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          {USE_MOCK
            ? "CTS mock mode — sign in with a seeded staff account (password: demo1234)."
            : "Sign in with your court staff credentials."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <div className="mb-4">
            <MissingProfileBanner />
          </div>
        </Suspense>

        <form action={handleSubmit} className="space-y-4">
          {USE_MOCK ? (
            <div className="space-y-2">
              <Label htmlFor="mock-user-select">Mock user</Label>
              <select
                id="mock-user-select"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={MOCK_USERS[0]?.id ?? ""}
                onChange={(event) => handleMockUser(event.target.value)}
              >
                {MOCK_USERS.filter((user) => user.isActive).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <FormError message={error} />

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
