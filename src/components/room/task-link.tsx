import { ExternalLink } from "@reinas/ui";

export function TaskLink({ href }: { href: string }) {
  return <ExternalLink href={href}>Abrir tarefa</ExternalLink>;
}
