import { faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function TaskLink({ href }: { href: string }) {
  return (
    <a
      className="inline-flex items-center gap-2 text-sm text-[var(--primary)] underline-offset-4 hover:underline"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      Abrir tarefa
      <FontAwesomeIcon icon={faLink} aria-hidden="true" className="text-xs" />
    </a>
  );
}
