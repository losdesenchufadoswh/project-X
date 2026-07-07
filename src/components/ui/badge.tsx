import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-data",
  {
    variants: {
      variant: {
        default: "bg-muted/20 text-foreground",
        success: "bg-success/15 text-success border border-success/40",
        warning: "bg-warning/15 text-warning border border-warning/40",
        danger: "bg-danger/15 text-danger border border-danger/40",
        primary: "bg-primary/15 text-primary border border-primary/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
