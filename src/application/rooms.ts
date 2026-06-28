import { and, asc, desc, eq, inArray, max, ne, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  roomParticipants,
  rooms,
  tasks,
  users,
  votes,
  votingRounds,
} from "@/infrastructure/db/schema";
import {
  createRoomSchema,
  roomPasswordSchema,
  taskTitleSchema,
  taskUrlSchema,
} from "@/domain/validation";
import { DomainError, forbidden } from "@/domain/errors";
import { DECKS, isValidVote, type VotingStyle } from "@/domain/voting";
import { sanitizeVotes } from "@/domain/projection";
import { hashPassword, verifyPassword } from "@/infrastructure/security/crypto";
import {
  roomPublisher,
  type RoomEvent,
} from "@/infrastructure/realtime/publisher";
import {
  repositories,
  type DatabaseExecutor,
} from "@/infrastructure/db/repositories";

function event(type: RoomEvent["type"], roomId: string) {
  roomPublisher.publishAfterCommit({
    type,
    roomId,
    at: new Date().toISOString(),
  });
}
export async function listOwnedRooms(userId: string) {
  return db
    .select()
    .from(rooms)
    .where(eq(rooms.adminId, userId))
    .orderBy(desc(rooms.createdAt));
}
export async function listAccessibleRooms(userId: string) {
  const rows = await db
    .select({ room: rooms })
    .from(roomParticipants)
    .innerJoin(rooms, eq(rooms.id, roomParticipants.roomId))
    .where(eq(roomParticipants.userId, userId))
    .orderBy(desc(rooms.createdAt));
  return rows.map(({ room }) => room);
}
export async function getRoomBySlug(slug: string) {
  const [room] = await db
    .select()
    .from(rooms)
    .where(sql`lower(${rooms.slug})=${slug.toLowerCase()}`)
    .limit(1);
  return room ?? null;
}
export async function createRoom(userId: string, input: unknown) {
  const value = createRoomSchema.parse(input);
  const passwordHash = await hashPassword(value.password);
  try {
    return await db.transaction(async (tx) => {
      const [room] = await tx
        .insert(rooms)
        .values({
          name: value.name,
          slug: value.slug,
          style: value.style,
          passwordHash,
          accessCode: value.password,
          adminId: userId,
        })
        .returning();
      await tx.insert(roomParticipants).values({ roomId: room.id, userId });
      return room;
    });
  } catch (e) {
    const cause = (e as { cause?: { constraint?: string } }).cause;
    if (
      cause?.constraint === "rooms_slug_lower_unique" ||
      (e as { constraint?: string }).constraint === "rooms_slug_lower_unique" ||
      String(e).includes("rooms_slug_lower_unique")
    )
      throw new DomainError(
        "SLUG_UNAVAILABLE",
        "Este link já está em uso",
        409,
      );
    throw e;
  }
}
export async function joinRoom(
  userId: string,
  roomId: string,
  rawPassword: string,
) {
  const password = roomPasswordSchema.parse(rawPassword);
  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  if (!room) throw new DomainError("NOT_FOUND", "Sala não encontrada", 404);
  if (room.status !== "ACTIVE")
    throw new DomainError("ROOM_FINISHED", "A sala foi finalizada", 409);
  if (!(await verifyPassword(room.passwordHash, password)))
    throw new DomainError("INVALID_PASSWORD", "Senha inválida", 400);
  await db
    .insert(roomParticipants)
    .values({ roomId, userId })
    .onConflictDoNothing();
  event("participant.joined", roomId);
}
export async function getMembership(
  roomId: string,
  userId: string,
  executor: DatabaseExecutor = db,
) {
  const [member] = await executor
    .select()
    .from(roomParticipants)
    .where(
      and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, userId),
      ),
    )
    .limit(1);
  return member ?? null;
}
async function roomContext(
  roomId: string,
  userId: string,
  admin = false,
  executor: DatabaseExecutor = db,
) {
  const [room] = await executor
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  if (!room) throw new DomainError("NOT_FOUND", "Sala não encontrada", 404);
  const member = await getMembership(roomId, userId, executor);
  if (!member) throw forbidden();
  if (admin && room.adminId !== userId) throw forbidden();
  if (room.status !== "ACTIVE")
    throw new DomainError("ROOM_FINISHED", "Sala finalizada", 409);
  return { room, member };
}
export async function addTask(
  userId: string,
  roomId: string,
  titleRaw: string,
  linkRaw: string,
) {
  const title = taskTitleSchema.parse(titleRaw),
    link = taskUrlSchema.parse(linkRaw);
  await repositories.transaction(async (tx) => {
    await repositories.lockRoom(tx, roomId);
    await roomContext(roomId, userId, true, tx);
    const [{ value: position }] = await tx
      .select({ value: max(tasks.position) })
      .from(tasks)
      .where(eq(tasks.roomId, roomId));
    const hasCurrent = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.roomId, roomId), eq(tasks.status, "VOTING")))
      .limit(1);
    const [task] = await tx
      .insert(tasks)
      .values({
        roomId,
        title,
        link,
        position: (position ?? -1) + 1,
        status: hasCurrent.length ? "PENDING" : "VOTING",
      })
      .returning();
    if (!hasCurrent.length)
      await tx.insert(votingRounds).values({ taskId: task.id, sequence: 1 });
  });
  event("queue.changed", roomId);
}
export async function editTask(
  userId: string,
  roomId: string,
  taskId: string,
  titleRaw: string,
  linkRaw: string,
) {
  await roomContext(roomId, userId, true);
  await db
    .update(tasks)
    .set({
      title: taskTitleSchema.parse(titleRaw),
      link: taskUrlSchema.parse(linkRaw),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.roomId, roomId),
        ne(tasks.status, "COMPLETED"),
      ),
    );
  event("queue.changed", roomId);
}
export async function removeTask(
  userId: string,
  roomId: string,
  taskId: string,
) {
  await roomContext(roomId, userId, true);
  await db.transaction(async (tx) => {
    await tx.execute(sql`select id from rooms where id=${roomId} for update`);
    const [removed] = await tx
      .delete(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.roomId, roomId),
          ne(tasks.status, "COMPLETED"),
        ),
      )
      .returning();
    if (!removed) return;
    const completed = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.roomId, roomId), eq(tasks.status, "COMPLETED")))
      .orderBy(asc(tasks.position));
    const pending = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.roomId, roomId), ne(tasks.status, "COMPLETED")))
      .orderBy(asc(tasks.position));
    const ordered = [...completed, ...pending];
    for (let i = 0; i < ordered.length; i++)
      await tx
        .update(tasks)
        .set({ position: 10000 + i })
        .where(eq(tasks.id, ordered[i].id));
    for (let i = 0; i < ordered.length; i++)
      await tx
        .update(tasks)
        .set({
          position: i,
          ...(ordered[i].status !== "COMPLETED"
            ? {
                status:
                  i === completed.length
                    ? ("VOTING" as const)
                    : ("PENDING" as const),
              }
            : {}),
        })
        .where(eq(tasks.id, ordered[i].id));
    if (removed.status === "VOTING" && pending[0])
      await tx
        .insert(votingRounds)
        .values({ taskId: pending[0].id, sequence: 1 })
        .onConflictDoNothing();
  });
  event("queue.changed", roomId);
}
export async function reorderTasks(
  userId: string,
  roomId: string,
  ids: string[],
) {
  await roomContext(roomId, userId, true);
  await db.transaction(async (tx) => {
    const eligible = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.roomId, roomId), ne(tasks.status, "COMPLETED")));
    if (
      ids.length !== eligible.length ||
      !eligible.every((t) => ids.includes(t.id))
    )
      throw new DomainError(
        "INVALID_ORDER",
        "A ordem deve conter todas as tarefas pendentes",
      );
    const completed = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.roomId, roomId), eq(tasks.status, "COMPLETED")));
    const base = completed.length;
    for (let i = 0; i < ids.length; i++)
      await tx
        .update(tasks)
        .set({ position: 10000 + i })
        .where(eq(tasks.id, ids[i]));
    for (let i = 0; i < ids.length; i++)
      await tx
        .update(tasks)
        .set({ position: base + i })
        .where(eq(tasks.id, ids[i]));
  });
  event("queue.changed", roomId);
}
async function currentRound(roomId: string, executor: DatabaseExecutor = db) {
  const [row] = await executor
    .select({ task: tasks, round: votingRounds })
    .from(tasks)
    .innerJoin(votingRounds, eq(votingRounds.taskId, tasks.id))
    .where(and(eq(tasks.roomId, roomId), eq(tasks.status, "VOTING")))
    .orderBy(desc(votingRounds.sequence))
    .limit(1);
  if (!row)
    throw new DomainError("NO_CURRENT_TASK", "Não há tarefa em votação", 409);
  return row;
}
export async function castVote(userId: string, roomId: string, value: string) {
  await repositories.transaction(async (tx) => {
    await repositories.lockRoom(tx, roomId);
    const { room, member } = await roomContext(roomId, userId, false, tx);
    if (!isValidVote(room.style as VotingStyle, value))
      throw new DomainError("INVALID_VOTE", "Carta inválida");
    const { round } = await currentRound(roomId, tx);
    if (round.status !== "OPEN")
      throw new DomainError("ROUND_CLOSED", "A rodada não aceita votos", 409);
    await tx
      .insert(votes)
      .values({ roundId: round.id, participantId: member.id, value })
      .onConflictDoUpdate({
        target: [votes.roundId, votes.participantId],
        set: { value, updatedAt: new Date() },
      });
  });
  event("vote.cast", roomId);
}
export async function revealVotes(userId: string, roomId: string) {
  await repositories.transaction(async (tx) => {
    await repositories.lockRoom(tx, roomId);
    await roomContext(roomId, userId, true, tx);
    const { round } = await currentRound(roomId, tx);
    const changed = await tx
      .update(votingRounds)
      .set({ status: "REVEALED", revealedAt: new Date() })
      .where(
        and(eq(votingRounds.id, round.id), eq(votingRounds.status, "OPEN")),
      )
      .returning();
    if (!changed.length)
      throw new DomainError("ROUND_CLOSED", "A rodada já foi encerrada", 409);
  });
  event("round.revealed", roomId);
}
export async function restartRound(userId: string, roomId: string) {
  await repositories.transaction(async (tx) => {
    await repositories.lockRoom(tx, roomId);
    await roomContext(roomId, userId, true, tx);
    const current = await currentRound(roomId, tx);
    await tx
      .update(votingRounds)
      .set({ status: "CLOSED" })
      .where(eq(votingRounds.id, current.round.id));
    await tx.insert(votingRounds).values({
      taskId: current.task.id,
      sequence: current.round.sequence + 1,
    });
  });
  event("round.restarted", roomId);
}
export async function completeTask(
  userId: string,
  roomId: string,
  result?: string,
) {
  await repositories.transaction(async (tx) => {
    await repositories.lockRoom(tx, roomId);
    const { room } = await roomContext(roomId, userId, true, tx);
    if (result && !isValidVote(room.style as VotingStyle, result))
      throw new DomainError("INVALID_RESULT", "Resultado inválido");
    const current = await currentRound(roomId, tx);
    if (current.round.status !== "REVEALED")
      throw new DomainError(
        "ROUND_NOT_REVEALED",
        "Revele os votos antes de concluir",
        409,
      );
    await tx
      .update(tasks)
      .set({
        status: "COMPLETED",
        finalResult: result || null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, current.task.id));
    const [next] = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.roomId, roomId), eq(tasks.status, "PENDING")))
      .orderBy(asc(tasks.position))
      .limit(1);
    if (next) {
      await tx
        .update(tasks)
        .set({ status: "VOTING" })
        .where(eq(tasks.id, next.id));
      await tx.insert(votingRounds).values({ taskId: next.id, sequence: 1 });
    }
  });
  event("task.completed", roomId);
}
export async function finishRoom(userId: string, roomId: string) {
  await repositories.transaction(async (tx) => {
    await repositories.lockRoom(tx, roomId);
    await roomContext(roomId, userId, true, tx);
    await tx
      .update(rooms)
      .set({
        status: "FINISHED",
        finishedAt: new Date(),
        version: sql`${rooms.version}+1`,
      })
      .where(eq(rooms.id, roomId));
    const current = await tx
      .select({ id: votingRounds.id })
      .from(tasks)
      .innerJoin(votingRounds, eq(votingRounds.taskId, tasks.id))
      .where(and(eq(tasks.roomId, roomId), eq(votingRounds.status, "OPEN")));
    if (current.length)
      await tx
        .update(votingRounds)
        .set({ status: "CLOSED" })
        .where(
          inArray(
            votingRounds.id,
            current.map((x) => x.id),
          ),
        );
    await tx
      .update(tasks)
      .set({ status: "COMPLETED", updatedAt: new Date() })
      .where(and(eq(tasks.roomId, roomId), ne(tasks.status, "COMPLETED")));
  });
  event("room.finished", roomId);
}
export async function roomProjection(roomId: string, userId: string) {
  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  if (!room) throw new DomainError("NOT_FOUND", "Sala não encontrada", 404);
  const member = await getMembership(roomId, userId);
  if (room.status === "ACTIVE" && !member) throw forbidden();
  const queue = await db
    .select()
    .from(tasks)
    .where(eq(tasks.roomId, roomId))
    .orderBy(asc(tasks.position));
  const participants = await db
    .select({ id: roomParticipants.id, userId: users.id, name: users.name })
    .from(roomParticipants)
    .innerJoin(users, eq(users.id, roomParticipants.userId))
    .where(eq(roomParticipants.roomId, roomId));
  let round: null | typeof votingRounds.$inferSelect = null;
  let visibleVotes: Array<{ participantId: string; value?: string }> = [];
  let selectedVote: string | undefined;
  const current = queue.find((t) => t.status === "VOTING");
  if (current) {
    [round] = await db
      .select()
      .from(votingRounds)
      .where(eq(votingRounds.taskId, current.id))
      .orderBy(desc(votingRounds.sequence))
      .limit(1);
    if (round) {
      const raw = await db
        .select({ participantId: votes.participantId, value: votes.value })
        .from(votes)
        .where(eq(votes.roundId, round.id));
      visibleVotes = sanitizeVotes(round.status, raw);
      selectedVote = raw.find((v) => v.participantId === member?.id)?.value;
    }
  }
  return {
    room: {
      id: room.id,
      name: room.name,
      slug: room.slug,
      style: room.style,
      status: room.status,
      adminId: room.adminId,
      accessCode: room.adminId === userId ? room.accessCode : null,
      finishedAt: room.finishedAt,
    },
    isAdmin: room.adminId === userId,
    member,
    deck: DECKS[room.style],
    tasks: queue,
    participants: participants.map((p) => ({
      ...p,
      hasVoted: visibleVotes.some((v) => v.participantId === p.id),
      vote: visibleVotes.find((v) => v.participantId === p.id)?.value,
    })),
    round: round && {
      id: round.id,
      status: round.status,
      sequence: round.sequence,
    },
    selectedVote,
  };
}
export async function roomSummary(roomId: string) {
  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  if (!room || room.status !== "FINISHED")
    throw new DomainError("NOT_FINISHED", "Sala ainda está ativa", 409);
  const queue = await db
    .select()
    .from(tasks)
    .where(eq(tasks.roomId, roomId))
    .orderBy(asc(tasks.position));
  const result = [];
  for (const task of queue) {
    const rounds = await db
      .select()
      .from(votingRounds)
      .where(eq(votingRounds.taskId, task.id))
      .orderBy(asc(votingRounds.sequence));
    const history = [];
    for (const round of rounds) {
      const roundVotes = await db
        .select({ value: votes.value, name: users.name })
        .from(votes)
        .innerJoin(
          roomParticipants,
          eq(roomParticipants.id, votes.participantId),
        )
        .innerJoin(users, eq(users.id, roomParticipants.userId))
        .where(eq(votes.roundId, round.id));
      history.push({
        sequence: round.sequence,
        status: round.status,
        votes: roundVotes,
      });
    }
    result.push({ ...task, rounds: history });
  }
  return { room, tasks: result };
}
