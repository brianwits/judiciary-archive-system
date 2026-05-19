import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { getSessionProfile, isAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function AppNav() {
  const profile = await getSessionProfile();

  if (!profile) return null;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            Judiciary Archive
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Cases
            </Link>
            {isAdmin(profile.role) && (
              <Link
                href="/admin/users"
                className="text-muted-foreground hover:text-foreground"
              >
                Users
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-sm sm:block">
            <span className="text-muted-foreground">{profile.fullName}</span>
            <Badge variant="secondary" className="ml-2 capitalize">
              {profile.role}
            </Badge>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
