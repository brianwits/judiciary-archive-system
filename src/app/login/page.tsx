"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { signIn } from "@/app/actions/auth";
import { MOCK_USERS } from "@/data/seed/users";
import { isMockDataEnabled } from "@/lib/config";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const USE_MOCK = isMockDataEnabled();

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState(MOCK_USERS[0]?.email ?? "");
  const [password, setPassword] = useState("demo1234");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await signIn(formData);
      if (result && !result.ok) {
        setError(result.error.message);
      }
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function handleDemoUser(value: string | null) {
    if (!value) return;
    const user = MOCK_USERS.find((u) => u.id === value);
    if (user) {
      setEmail(user.email);
      setPassword("demo1234");
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Scale className="size-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">Judiciary of Kenya</p>
            <p className="text-sm text-sidebar-foreground/70">Archive Management System</p>
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Secure physical & digital case file archive
          </h1>
          <p className="max-w-md text-sidebar-foreground/80">
            Track file movements, manage archive storage, scan documents, and maintain a
            complete audit trail for court operations.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">
          © {new Date().getFullYear()} Judiciary Archive System
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              {USE_MOCK
                ? "Demo mode — select a user or enter credentials (password: demo1234)"
                : "Sign in with your court staff credentials."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {USE_MOCK && (
                <div className="space-y-2">
                  <Label>Demo user</Label>
                  <Select onValueChange={handleDemoUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Quick select demo account" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_USERS.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
