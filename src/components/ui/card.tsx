import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-pebble border p-6 shadow-sm",
        "bg-sand-50 border-sand-200",
        "dark:bg-dusk-700 dark:border-dusk-500",
        className,
      )}
      {...props}
    />
  );
}
