"use client";

import { memo } from "react";
import { Badge, Button, Card } from "@reinas/ui";
import { TaskLink } from "./task-link";
import { VoteValue } from "./vote-value";
import type { Projection, RoomCommand } from "./types";

type Task = Projection["tasks"][number];
type Round = NonNullable<Projection["round"]>;

/**
 * O deck é o bloco que mais re-renderiza durante uma rodada, então fica
 * isolado e memoizado: só muda quando o deck, o voto ou o estado da rodada muda.
 */
const VoteDeck = memo(function VoteDeck({
  deck,
  selectedVote,
  open,
  onVote,
}: {
  deck: readonly string[];
  selectedVote?: string;
  open: boolean;
  onVote: (value: string) => void;
}) {
  return (
    <div className="my-6 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
      {deck.map((value) => {
        const isSelected = selectedVote === value;
        return (
          <Button
            key={value}
            variant="technical"
            className="h-14 text-lg"
            selected={isSelected}
            aria-pressed={isSelected}
            disabled={!open}
            onClick={() => onVote(value)}
          >
            <VoteValue value={value} />
          </Button>
        );
      })}
    </div>
  );
});

const AdminControls = memo(function AdminControls({
  deck,
  round,
  onCommand,
}: {
  deck: readonly string[];
  round: Round;
  onCommand: (command: RoomCommand) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
      <Button
        disabled={round.status !== "OPEN"}
        onClick={() => onCommand({ action: "round.reveal" })}
      >
        Revelar votos
      </Button>
      <Button
        variant="outline"
        onClick={() => onCommand({ action: "round.restart" })}
      >
        Reiniciar
      </Button>
      {round.status === "REVEALED" && (
        <>
          <Button
            variant="outline"
            onClick={() => onCommand({ action: "task.complete" })}
          >
            Sem consenso
          </Button>
          {deck.map((value) => (
            <Button
              key={`result-${value}`}
              variant="ghost"
              onClick={() =>
                onCommand({ action: "task.complete", result: value })
              }
            >
              Concluir: <VoteValue value={value} />
            </Button>
          ))}
        </>
      )}
    </div>
  );
});

function CurrentTaskImpl({
  task,
  round,
  deck,
  selectedVote,
  isAdmin,
  onCommand,
  onVote,
}: {
  task?: Task;
  round: Projection["round"];
  deck: readonly string[];
  selectedVote?: string;
  isAdmin: boolean;
  onCommand: (command: RoomCommand) => void;
  onVote: (value: string) => void;
}) {
  return (
    <Card tone="technical">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-[var(--primary)]">
            current.task
          </p>
          <h2 className="text-xl font-semibold">
            {task?.title ?? "Nenhuma tarefa na fila"}
          </h2>
          {task && <TaskLink href={task.link} />}
        </div>
        {task && round && (
          <Badge variant={round.status === "REVEALED" ? "result" : "voting"}>
            {round.status === "REVEALED" ? "Votos revelados" : "Votação aberta"}
          </Badge>
        )}
      </div>

      {task && round && (
        <>
          <VoteDeck
            deck={deck}
            selectedVote={selectedVote}
            open={round.status === "OPEN"}
            onVote={onVote}
          />
          {isAdmin && (
            <AdminControls deck={deck} round={round} onCommand={onCommand} />
          )}
        </>
      )}
    </Card>
  );
}

export const CurrentTask = memo(CurrentTaskImpl);
