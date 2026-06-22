import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({ className, variant="default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?:"default"|"outline"|"danger"|"ghost"}) {
  return <button className={cn("inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition disabled:opacity-50 focus-visible:outline-2", variant==="default"&&"bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black", variant==="outline"&&"border bg-transparent", variant==="danger"&&"bg-red-600 text-white", variant==="ghost"&&"hover:bg-zinc-100 dark:hover:bg-zinc-800", className)} {...props}/>;
}
