"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Moon,
  Sun,
  Monitor,
  Bell,
  BellRing,
  BellOff,
  Mail,
  Sparkles,
  X,
} from "lucide-react";
import {
  changePassword,
  updateNotificationPreferences,
} from "@/app/actions/settings";
import type { NotificationPreferences } from "@/types/notification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";


// ---------------------------------------------------------------------------
// Theme Selector
// ---------------------------------------------------------------------------

const THEMES = [
  { value: "light", label: "Light", icon: Sun, description: "Clean, bright interface" },
  { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
  { value: "system", label: "System", icon: Monitor, description: "Follows your OS setting" },
] as const;

/** Subscribe to nothing — returns `true` on client, `false` on server for hydration safety. */
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {THEMES.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.value}
              className="flex cursor-default flex-col items-center gap-2 rounded-lg border border-border/50 bg-card p-4 opacity-50"
            >
              <Icon className="size-6 text-muted-foreground" />
              <span className="text-sm font-medium">{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.description}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {THEMES.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => setTheme(t.value)}
            className={cn(
              "group relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/50 bg-card hover:border-muted-foreground/30 hover:bg-accent/30",
            )}
          >
            {isActive && (
              <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
            )}
            <Icon
              className={cn("size-6", isActive ? "text-primary" : "text-muted-foreground")}
            />
            <span
              className={cn(
                "text-sm font-medium",
                isActive ? "text-primary" : "text-foreground",
              )}
            >
              {t.label}
            </span>
            <span className="text-xs text-muted-foreground">{t.description}</span>
            {isActive && (
              <span className="mt-1 text-xs font-medium text-primary">Active</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

import {
  evaluateStrength,
  generateStrongPassword,
  STRENGTH_CONFIG,
  CRITERIA,
} from "@/lib/password-strength";

function StrengthMeter({ password }: { password: string }) {
  const level = evaluateStrength(password);
  if (level === "empty") return null;

  const config = STRENGTH_CONFIG[level];
  const passed = CRITERIA.filter((c) => c.test(password)).length;

  return (
    <div className="mt-3 space-y-3">
      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${config.barColor}`}
          style={{ width: config.barWidth }}
        />
      </div>

      {/* Label */}
      <p className={`text-xs font-medium ${config.color}`}>
        {config.label} — {passed} of {CRITERIA.length} requirements met
      </p>

      {/* Criteria checklist */}
      <ul className="space-y-1">
        {CRITERIA.map((c) => {
          const met = c.test(password);
          return (
            <li
              key={c.key}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            >
              <span className="inline-flex size-3.5 items-center justify-center">
                {met ? (
                  <Check className="size-3" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </span>
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm password match indicator
// ---------------------------------------------------------------------------

function ConfirmMatchIndicator({
  newPassword,
  confirmPassword,
}: {
  newPassword: string;
  confirmPassword: string;
}) {
  if (!confirmPassword) return null;

  const match = newPassword === confirmPassword;

  return (
    <div
      className={cn(
        "mt-1 flex items-center gap-1.5 text-xs transition-all",
        match
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-destructive",
      )}
    >
      {match ? (
        <>
          <Check className="size-3.5" />
          <span>Passwords match</span>
        </>
      ) : (
        <>
          <X className="size-3.5" />
          <span>Passwords do not match</span>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Password Change Form
// ---------------------------------------------------------------------------

function PasswordChangeForm() {
  const [isPending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [revealAll, setRevealAll] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");

  function handleRevealAll() {
    const next = !revealAll;
    setRevealAll(next);
    setShowCurrent(next);
    setShowNew(next);
    setShowConfirm(next);
  }

  function handleToggleField(
    setter: (v: boolean) => void,
    current: boolean,
  ) {
    setter(!current);
    // Any individual toggle exits reveal-all mode
    setRevealAll(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await changePassword(formData);
      if (!result.ok) {
        if (result.error.fieldErrors) {
          setFieldErrors(result.error.fieldErrors);
        }
        toast.error(result.error.message);
        return;
      }
      toast.success("Password changed successfully");
      setNewPasswordValue("");
      setConfirmPasswordValue("");
      // Reset form
      (event.target as HTMLFormElement).reset();
    });
  }

  function showFieldError(field: string) {
    return fieldErrors[field]?.length ? (
      <p className="text-xs text-destructive">{fieldErrors[field][0]}</p>
    ) : null;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
          onClick={handleRevealAll}
        >
          {revealAll ? (
            <>
              <EyeOff className="size-3" />
              Hide all
            </>
          ) : (
            <>
              <Eye className="size-3" />
              Show all
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            name="currentPassword"
            type={showCurrent ? "text" : "password"}
            placeholder="Enter your current password"
            autoComplete="current-password"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => handleToggleField(setShowCurrent, showCurrent)}
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </Button>
        </div>
        {showFieldError("currentPassword")}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="newPassword">New password</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => {
              const pw = generateStrongPassword();
              setNewPasswordValue(pw);
              setConfirmPasswordValue(pw);
              toast.success("Strong password generated");
            }}
          >
            <Sparkles className="size-3" />
            Generate
          </Button>
        </div>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showNew ? "text" : "password"}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPasswordValue}
            onChange={(e) => setNewPasswordValue(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => handleToggleField(setShowNew, showNew)}
            aria-label={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </Button>
        </div>
        {showFieldError("newPassword")}
        <StrengthMeter password={newPasswordValue} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            required
            value={confirmPasswordValue}
            onChange={(e) => setConfirmPasswordValue(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => handleToggleField(setShowConfirm, showConfirm)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </Button>
        </div>
        {showFieldError("confirmPassword")}
        <ConfirmMatchIndicator
          newPassword={newPasswordValue}
          confirmPassword={confirmPasswordValue}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {isPending ? "Changing..." : "Change password"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Notification Preferences
// ---------------------------------------------------------------------------

function NotificationPreferences({
  initialPrefs,
}: {
  initialPrefs: NotificationPreferences;
}) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPrefs);
  const [saving, setSaving] = useState<string | null>(null);

  async function toggle(key: keyof NotificationPreferences) {
    const nextValue = !prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: nextValue }));
    setSaving(key);

    try {
      const result = await updateNotificationPreferences({ [key]: nextValue });
      if (!result.ok) {
        // Revert on failure
        setPrefs((prev) => ({ ...prev, [key]: !nextValue }));
        toast.error(result.error.message);
        return;
      }
      toast.success(
        nextValue
          ? `${getPrefLabel(key)} enabled`
          : `${getPrefLabel(key)} disabled`,
      );
    } catch {
      setPrefs((prev) => ({ ...prev, [key]: !nextValue }));
      toast.error("Failed to save preference. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  function getPrefLabel(key: keyof NotificationPreferences): string {
    const labels: Record<keyof NotificationPreferences, string> = {
      emailNotifications: "Email notifications",
      fileMovementAlerts: "File movement alerts",
      overdueReminders: "Overdue reminders",
      weeklyDigest: "Weekly digest",
    };
    return labels[key];
  }

  function getPrefDescription(key: keyof NotificationPreferences): string {
    const descriptions: Record<keyof NotificationPreferences, string> = {
      emailNotifications: "Receive account activity alerts via email",
      fileMovementAlerts: "Get notified when files are checked out or returned",
      overdueReminders: "Daily reminders for overdue file returns",
      weeklyDigest: "Weekly summary of archive activity",
    };
    return descriptions[key];
  }

  const toggles: { key: keyof NotificationPreferences; icon: typeof Bell }[] = [
    { key: "emailNotifications", icon: Mail },
    { key: "fileMovementAlerts", icon: BellRing },
    { key: "overdueReminders", icon: Bell },
    { key: "weeklyDigest", icon: BellOff },
  ];

  return (
    <div className="space-y-4">
      {toggles.map(({ key, icon: Icon }) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/30"
        >
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{getPrefLabel(key)}</p>
              <p className="text-xs text-muted-foreground">{getPrefDescription(key)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving === key && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
            <Switch
              checked={prefs[key]}
              onCheckedChange={() => toggle(key)}
              disabled={saving === key}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Combined Settings Form
// ---------------------------------------------------------------------------

export function SettingsForm({
  initialNotificationPrefs,
}: {
  initialNotificationPrefs: NotificationPreferences;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Update your account password. You&apos;ll be asked to sign in again after changing it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customise the look and feel of the archive system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <p className="mb-3 text-xs text-muted-foreground">
                Choose your preferred colour scheme
              </p>
              <ThemeSelector />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what updates you&apos;d like to receive</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferences initialPrefs={initialNotificationPrefs} />
        </CardContent>
      </Card>
    </div>
  );
}
