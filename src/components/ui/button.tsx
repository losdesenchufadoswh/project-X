import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/85",
        success: "bg-success text-white hover:bg-success/85",
        danger: "bg-danger text-white hover:bg-danger/85",
        outline: "border border-muted/40 bg-transparent text-foreground hover:bg-surface hover:border-primary/60",
        ghost: "bg-transparent text-muted hover:text-foreground hover:bg-surface",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
