import {
  forwardRef,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-ink text-white hover:bg-gold-dark",
        variant === "secondary" &&
          "border border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
        variant === "ghost" && "bg-transparent text-current hover:bg-black/5",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-13 px-7 text-base",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
