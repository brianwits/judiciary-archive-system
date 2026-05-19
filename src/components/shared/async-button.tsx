import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type AsyncButtonProps = React.ComponentProps<typeof Button> & {
  pending?: boolean;
  pendingLabel?: string;
};

export function AsyncButton({
  children,
  disabled,
  pending = false,
  pendingLabel = "Working...",
  ...props
}: AsyncButtonProps) {
  return (
    <Button disabled={disabled || pending} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
