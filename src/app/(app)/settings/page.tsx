import { PageHeader } from "@/components/layout/page-header";
import { getSessionProfile } from "@/lib/auth";
import { isMockDataEnabled } from "@/lib/config";
import { ROLE_LABELS } from "@/types/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SettingsForm } from "./settings-form";
import { getNotificationPreferences } from "@/app/actions/settings";

export default async function SettingsPage() {
  const profile = await getSessionProfile();
  const notificationPrefs = await getNotificationPreferences();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Account, appearance, and system preferences"
      />

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your signed-in court staff account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{profile?.fullName ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{profile?.email ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="outline">
                {profile ? ROLE_LABELS[profile.role] : "—"}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">PJ Number</span>
              <span>{profile?.pjNumber ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department</span>
              <span>{profile?.department ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Interactive settings (password, appearance, notifications) */}
        <SettingsForm initialNotificationPrefs={notificationPrefs} />

        {/* System info */}
        <Card>
          <CardHeader>
            <CardTitle>System</CardTitle>
            <CardDescription>Environment configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data mode</span>
              <Badge variant="secondary">
                {isMockDataEnabled() ? "Mock / demo" : "Supabase"}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Application</span>
              <span>Judiciary Archive System</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>0.1.0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
