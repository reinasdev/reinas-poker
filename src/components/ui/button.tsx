import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "danger" | "ghost" | "technical";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition",
        "border border-transparent shadow-sm shadow-black/20",
        "focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2",
        "active:translate-y-px disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45",
        variant === "default" &&
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-85",
        variant === "outline" &&
          "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]",
        variant === "danger" &&
          "border-[var(--border-strong)] bg-[var(--danger)] text-[var(--danger-foreground)] hover:opacity-85",
        variant === "ghost" &&
          "bg-transparent text-[var(--muted-foreground)] shadow-none hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
        variant === "technical" &&
          "technical-surface text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]",
        className,
      )}
      {...props}
    />
  );
}
