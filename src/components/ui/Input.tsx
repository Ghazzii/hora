import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-sm border border-black/20 bg-white px-3 text-sm text-ink placeholder:text-black/45 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:bg-black/5",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
