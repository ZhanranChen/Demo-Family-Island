import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-honey-500 text-ink-900 hover:bg-honey-600 dark:bg-honey-400 dark:hover:bg-honey-500",
  secondary:
    "bg-moss-500 text-sand-50 hover:bg-moss-600 dark:bg-moss-400 dark:text-dusk-900 dark:hover:bg-moss-500",
  ghost:
    "bg-transparent text-ink-900 hover:bg-sand-200/60 dark:text-mist-100 dark:hover:bg-dusk-500/60",
};

/**
 * `rounded-pebble` (defined in globals.css) is used instead of a sharp or
 * fully-pill radius on purpose — it reads as a smooth river stone rather
 * than a generic SaaS button, which is the one shape-level "signature"
 * detail this design system leans on.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "rounded-pebble px-5 py-2.5 font-medium",
          "transition-colors duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
