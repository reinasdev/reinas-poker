"use client";

import { memo } from "react";
import { Badge, Card, CardHeader } from "@reinas/ui";
import { VoteValue } from "./vote-value";
import type { Projection } from "./types";

type Participant = Projection["participants"][number];

const ParticipantRow = memo(function ParticipantRow({
  participant,
}: {
  participant: Participant;
}) {
  const revealed = Boolean(participant.vote);
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
      <span className="min-w-0 truncate text-sm">
        {participant.name ?? "Participante"}
      </span>
      <Badge
        variant={revealed ? "result" : participant.hasVoted ? "active" : "pending"}
      >
        {participant.vote ? (
          <VoteValue value={participant.vote} />
        ) : participant.hasVoted ? (
          "Votou"
        ) : (
          "Aguardando"
        )}
      </Badge>
    </div>
  );
});

function ParticipantsImpl({
  participants,
}: {
  participants: readonly Participant[];
}) {
  return (
    <Card>
      <CardHeader
        eyebrow="participants"
        title="Participantes"
        actions={<Badge>{participants.length} online</Badge>}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {participants.map((participant) => (
          <ParticipantRow key={participant.id} participant={participant} />
        ))}
      </div>
    </Card>
  );
}

export const Participants = memo(ParticipantsImpl);
