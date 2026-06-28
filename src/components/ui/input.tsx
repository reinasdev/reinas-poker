import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--technical)] px-3 text-sm text-[var(--foreground)] shadow-inner shadow-black/20",
        "placeholder:text-[var(--muted)]",
        "focus-visible:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
        "disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}
