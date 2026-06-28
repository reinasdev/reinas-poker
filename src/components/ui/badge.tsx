import type * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "active"
  | "finished"
  | "pending"
  | "voting"
  | "completed"
  | "result"
  | "danger"
  | "technical";

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold leading-5",
        "font-[var(--font-jetbrains-mono)]",
        variant === "default" &&
          "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted-foreground)]",
        variant === "active" &&
          "border-[var(--badge-active-border)] bg-[var(--badge-active-bg)] text-[var(--badge-active-text)]",
        variant === "finished" &&
          "border-[var(--badge-finished-border)] bg-[var(--badge-finished-bg)] text-[var(--badge-finished-text)]",
        variant === "pending" &&
          "border-[var(--badge-pending-border)] bg-[var(--badge-pending-bg)] text-[var(--badge-pending-text)]",
        variant === "voting" &&
          "border-[var(--badge-voting-border)] bg-[var(--badge-voting-bg)] text-[var(--badge-voting-text)]",
        variant === "completed" &&
          "border-[var(--badge-completed-border)] bg-[var(--badge-completed-bg)] text-[var(--badge-completed-text)]",
        variant === "result" &&
          "border-[var(--badge-result-border)] bg-[var(--badge-result-bg)] text-[var(--badge-result-text)]",
        variant === "danger" &&
          "border-[var(--badge-danger-border)] bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)]",
        variant === "technical" && "technical-surface text-[var(--primary)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
