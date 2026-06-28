import { faDev, faOpenai } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function AppFooter() {
  return (
    <footer className="border-t border-[var(--border)] px-4 py-4 text-xs text-[var(--muted-foreground)] md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-2">
        <span>Criado por</span>
        <FontAwesomeIcon
          icon={faDev}
          aria-label="dev"
          className="h-3.5 w-3.5 shrink-0"
        />
        <span className="font-semibold text-[var(--foreground)]">reinasdev</span>
        <span>com</span>
        <FontAwesomeIcon
          icon={faOpenai}
          aria-label="OpenAI"
          className="h-3.5 w-3.5 shrink-0"
        />
        <span className="font-semibold text-[var(--foreground)]">codex</span>
      </div>
    </footer>
  );
}
