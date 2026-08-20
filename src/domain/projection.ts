export type StoredVote = { participantId: string; value: string };
export function sanitizeVotes(
  status: "OPEN" | "REVEALED" | "CLOSED",
  raw: StoredVote[],
) {
  return raw.map((v) =>
    status === "REVEALED"
      ? { participantId: v.participantId, value: v.value }
      : { participantId: v.participantId },
  );
}
