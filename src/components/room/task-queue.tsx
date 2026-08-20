"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { memo, type FormEvent } from "react";
import { Badge, Button, Card, Input, type BadgeVariant } from "@reinas/ui";
import { taskStatusLabel } from "@/presentation/labels";
import type { Projection, RoomCommand } from "./types";

type Task = Projection["tasks"][number];

export function taskBadgeVariant(status: string): BadgeVariant {
  if (status === "COMPLETED") return "completed";
  if (status === "VOTING") return "voting";
  return "pending";
}

const TaskRow = memo(function TaskRow({
  task,
  isAdmin,
  onCommand,
  onMove,
}: {
  task: Task;
  isAdmin: boolean;
  onCommand: (command: RoomCommand) => void;
  onMove: (taskId: string, delta: number) => void;
}) {
  function editTask() {
    const title = window.prompt("Título", task.title);
    const link = window.prompt("Link", task.link);
    if (title && link)
      onCommand({ action: "task.edit", taskId: task.id, title, link });
  }

  return (
    <li className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{task.title}</div>
          {task.finalResult && (
            <Badge className="mt-2" variant="result">
              Resultado: {task.finalResult}
            </Badge>
          )}
        </div>
        <Badge variant={taskBadgeVariant(task.status)}>
          {taskStatusLabel(task.status)}
        </Badge>
      </div>
      {isAdmin && task.status !== "COMPLETED" && (
        <div className="mt-3 flex flex-wrap gap-1">
          <Button
            className="h-8 w-8"
            size="icon"
            variant="ghost"
            aria-label="Mover para cima"
            onClick={() => onMove(task.id, -1)}
          >
            <ArrowUp size={16} aria-hidden="true" />
          </Button>
          <Button
            className="h-8 w-8"
            size="icon"
            variant="ghost"
            aria-label="Mover para baixo"
            onClick={() => onMove(task.id, 1)}
          >
            <ArrowDown size={16} aria-hidden="true" />
          </Button>
          <Button
            className="h-8 w-8"
            size="icon"
            variant="ghost"
            aria-label="Editar tarefa"
            onClick={editTask}
          >
            <Pencil size={16} aria-hidden="true" />
          </Button>
          <Button
            className="h-8 w-8"
            size="icon"
            variant="ghost"
            aria-label="Remover tarefa"
            onClick={() => onCommand({ action: "task.remove", taskId: task.id })}
          >
            <Trash2 size={16} aria-hidden="true" />
          </Button>
        </div>
      )}
    </li>
  );
});

function TaskQueueImpl({
  tasks,
  isAdmin,
  onCommand,
  onMove,
}: {
  tasks: readonly Task[];
  isAdmin: boolean;
  onCommand: (command: RoomCommand) => void;
  onMove: (taskId: string, delta: number) => void;
}) {
  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    onCommand({
      action: "task.add",
      title: data.get("title"),
      link: data.get("link"),
    });
    form.reset();
  }

  return (
    <Card className="lg:sticky lg:top-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase text-[var(--primary)]">
          task.queue
        </p>
        <h2 className="mt-1 font-semibold">Fila de tarefas</h2>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-md border border-[var(--border)] bg-[var(--technical)] p-3 text-sm text-[var(--muted-foreground)]">
          Nenhuma tarefa na fila
        </p>
      ) : (
        <ol className="space-y-2">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isAdmin={isAdmin}
              onCommand={onCommand}
              onMove={onMove}
            />
          ))}
        </ol>
      )}
      {isAdmin && (
        <form
          className="mt-5 space-y-2 border-t border-[var(--border)] pt-4"
          onSubmit={addTask}
        >
          <Input name="title" placeholder="Título da tarefa" required />
          <Input name="link" type="url" placeholder="https://..." required />
          <Button className="w-full">Adicionar tarefa</Button>
        </form>
      )}
    </Card>
  );
}

export const TaskQueue = memo(TaskQueueImpl);
