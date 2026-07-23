import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names (clsx) and then resolves conflicting
 * Tailwind utility classes in favor of the last one (tailwind-merge) — e.g.
 * cn("px-2", condition && "px-4") correctly yields "px-4" instead of both
 * classes fighting in the stylesheet cascade.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
