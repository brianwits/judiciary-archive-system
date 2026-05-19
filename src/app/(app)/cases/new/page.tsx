import Link from "next/link";
import { CaseForm } from "@/components/cases/case-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewCasePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/cases"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        ← Back to cases
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>New case</CardTitle>
          <CardDescription>Register a new case in the archive.</CardDescription>
        </CardHeader>
        <CardContent>
          <CaseForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
