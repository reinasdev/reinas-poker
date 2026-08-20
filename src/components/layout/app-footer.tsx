import { ClaudeMark, DevMark } from "@reinas/ui";

export function AppFooter() {
  return (
    <footer className="border-t border-[var(--border)] px-4 py-4 text-xs text-[var(--muted-foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-2">
        <span>Criado por</span>
        <DevMark size={14} aria-label="dev" className="shrink-0" />
        <span className="font-semibold text-[var(--foreground)]">
          reinasdev
        </span>
        <span>com</span>
        <ClaudeMark size={14} aria-label="Claude" className="shrink-0" />
        <span className="font-semibold text-[var(--foreground)]">claude</span>
      </div>
    </footer>
  );
}
