const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  VOTING: "Em votação",
  COMPLETED: "Concluída",
};

export function taskStatusLabel(status: string) {
  return TASK_STATUS_LABELS[status] ?? status;
}
