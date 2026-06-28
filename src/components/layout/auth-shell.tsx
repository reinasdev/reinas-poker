import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4">
      <div className="mx-auto flex w-full max-w-7xl justify-end">
        <ThemeToggle />
      </div>
      <div className="grid min-h-[calc(100vh-8rem)] place-items-center">
        {children}
      </div>
    </div>
  );
}
