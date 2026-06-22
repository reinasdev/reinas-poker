import * as React from "react";
import { cn } from "@/lib/utils";
export function Card({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn("rounded-xl border bg-[var(--card)] p-6 shadow-sm",className)} {...props}/>}
