import { cn } from "@/lib/utils";

type ResponsiveTableShellProps = React.ComponentProps<"div">;

export function ResponsiveTableShell({
  className,
  children,
  ...props
}: ResponsiveTableShellProps) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border", className)} {...props}>
      {children}
    </div>
  );
}
