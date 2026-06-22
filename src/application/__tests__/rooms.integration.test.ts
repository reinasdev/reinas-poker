import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  magicCodes,
  roomParticipants,
  rooms,
  sessions,
  tasks,
  users,
  votes,
  votingRounds,
} from "@/infrastructure/db/schema";
import {
  addTask,
  castVote,
  completeTask,
  createRoom,
  editTask,
  finishRoom,
  joinRoom,
  removeTask,
  reorderTasks,
  restartRound,
  revealVotes,
  roomProjection,
  roomSummary,
} from "../rooms";

const run = process.env.RUN_DB_TESTS === "1";
describe.skipIf(!run)("room workflow with PostgreSQL", () => {
  beforeEach(async () => {
    await db.delete(votes);
    await db.delete(votingRounds);
    await db.delete(tasks);
    await db.delete(roomParticipants);
    await db.delete(rooms);
    await db.delete(sessions);
    await db.delete(magicCodes);
    await db.delete(users);
  });
  it("enforces authorization, hides votes, preserves rounds and finalizes", async () => {
    const [admin, participant] = await db
      .insert(users)
      .values([
        { email: "admin@example.com", name: "Admin" },
        { email: "participant@example.com", name: "Participant" },
      ])
      .returning();
    const room = await createRoom(admin.id, {
      name: "Sprint",
      slug: "sp01",
      password: "1234",
      style: "FIBONACCI",
    });
    await expect(
      createRoom(admin.id, {
        name: "Duplicate",
        slug: "SP01",
        password: "1234",
        style: "SCRUM",
      }),
    ).rejects.toMatchObject({ code: "SLUG_UNAVAILABLE" });
    await expect(
      joinRoom(participant.id, room.id, "9999"),
    ).rejects.toMatchObject({ code: "INVALID_PASSWORD" });
    await joinRoom(participant.id, room.id, "1234");
    await expect(
      addTask(participant.id, room.id, "Nope", "https://example.com/nope"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await addTask(admin.id, room.id, "Issue 1", "https://example.com/1");
    await addTask(admin.id, room.id, "Issue 2", "https://example.com/2");
    await castVote(participant.id, room.id, "8");
    let projection = await roomProjection(room.id, admin.id);
    expect(
      projection.participants.find((p) => p.userId === participant.id),
    ).toMatchObject({ hasVoted: true, vote: undefined });
    await revealVotes(admin.id, room.id);
    projection = await roomProjection(room.id, participant.id);
    expect(
      projection.participants.find((p) => p.userId === participant.id)?.vote,
    ).toBe("8");
    await restartRound(admin.id, room.id);
    projection = await roomProjection(room.id, participant.id);
    expect(
      projection.participants.find((p) => p.userId === participant.id)
        ?.hasVoted,
    ).toBe(false);
    await castVote(participant.id, room.id, "13");
    await revealVotes(admin.id, room.id);
    await completeTask(admin.id, room.id, "13");
    projection = await roomProjection(room.id, participant.id);
    expect(projection.tasks.filter((t) => t.status === "VOTING")).toHaveLength(
      1,
    );
    expect(
      projection.participants.find((p) => p.userId === participant.id)
        ?.hasVoted,
    ).toBe(false);
    await finishRoom(admin.id, room.id);
    await expect(castVote(participant.id, room.id, "5")).rejects.toMatchObject({
      code: "ROOM_FINISHED",
    });
    await expect(
      joinRoom(crypto.randomUUID(), room.id, "1234"),
    ).rejects.toMatchObject({ code: "ROOM_FINISHED" });
    const summary = await roomSummary(room.id);
    expect(summary.tasks[0].rounds).toHaveLength(2);
    expect(summary.tasks[0].finalResult).toBe("13");
    expect(summary.tasks[1].finalResult).toBeNull();
  });
  it("stores only password hashes and makes joining idempotent", async () => {
    const [admin, participant] = await db
      .insert(users)
      .values([
        { email: "owner@example.com", name: "Owner" },
        { email: "joiner@example.com", name: "Joiner" },
      ])
      .returning();
    const room = await createRoom(admin.id, {
      name: "Secure",
      slug: "safe",
      password: "1234",
      style: "SCRUM",
    });
    const [stored] = await db.select().from(rooms).where(eq(rooms.id, room.id));
    expect(stored.passwordHash).not.toContain("1234");
    expect(stored.passwordHash).toContain("argon2id");
    await joinRoom(participant.id, room.id, "1234");
    await joinRoom(participant.id, room.id, "1234");
    const memberships = await db
      .select()
      .from(roomParticipants)
      .where(
        and(
          eq(roomParticipants.roomId, room.id),
          eq(roomParticipants.userId, participant.id),
        ),
      );
    expect(memberships).toHaveLength(1);
  });
  it("rejects every administrative command from a participant", async () => {
    const [admin, participant] = await db
      .insert(users)
      .values([
        { email: "admin-authz@example.com", name: "Admin" },
        { email: "member-authz@example.com", name: "Member" },
      ])
      .returning();
    const room = await createRoom(admin.id, {
      name: "Authorization",
      slug: "authz",
      password: "1234",
      style: "SCRUM",
    });
    await joinRoom(participant.id, room.id, "1234");
    await addTask(admin.id, room.id, "Task", "https://example.com/task");
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.roomId, room.id));
    for (const operation of [
      () => addTask(participant.id, room.id, "No", "https://example.com/no"),
      () =>
        editTask(
          participant.id,
          room.id,
          task.id,
          "No",
          "https://example.com/no",
        ),
      () => removeTask(participant.id, room.id, task.id),
      () => reorderTasks(participant.id, room.id, [task.id]),
      () => revealVotes(participant.id, room.id),
      () => restartRound(participant.id, room.id),
      () => completeTask(participant.id, room.id),
      () => finishRoom(participant.id, room.id),
    ])
      await expect(operation()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("maintains a contiguous queue and exactly one current task", async () => {
    const [admin] = await db
      .insert(users)
      .values({ email: "queue@example.com", name: "Queue Admin" })
      .returning();
    const room = await createRoom(admin.id, {
      name: "Queue",
      slug: "queue",
      password: "1234",
      style: "FIBONACCI",
    });
    await Promise.all([
      addTask(admin.id, room.id, "A", "https://example.com/a"),
      addTask(admin.id, room.id, "B", "https://example.com/b"),
      addTask(admin.id, room.id, "C", "https://example.com/c"),
    ]);
    let queue = await db
      .select()
      .from(tasks)
      .where(eq(tasks.roomId, room.id))
      .orderBy(tasks.position);
    expect(queue.map((t) => t.position)).toEqual([0, 1, 2]);
    expect(queue.filter((t) => t.status === "VOTING")).toHaveLength(1);
    await expect(
      editTask(admin.id, room.id, queue[0].id, "Bad", "not-a-url"),
    ).rejects.toBeDefined();
    await expect(
      reorderTasks(admin.id, room.id, [queue[0].id]),
    ).rejects.toMatchObject({ code: "INVALID_ORDER" });
    await reorderTasks(admin.id, room.id, queue.map((t) => t.id).reverse());
    const current = queue.find((t) => t.status === "VOTING")!;
    await removeTask(admin.id, room.id, current.id);
    queue = await db
      .select()
      .from(tasks)
      .where(eq(tasks.roomId, room.id))
      .orderBy(tasks.position);
    expect(queue.map((t) => t.position)).toEqual([0, 1]);
    expect(queue.filter((t) => t.status === "VOTING")).toHaveLength(1);
  });
  it("serializes vote, reveal, restart and advance races", async () => {
    const [admin, participant] = await db
      .insert(users)
      .values([
        { email: "race-admin@example.com", name: "Admin" },
        { email: "race-member@example.com", name: "Member" },
      ])
      .returning();
    const room = await createRoom(admin.id, {
      name: "Race",
      slug: "race",
      password: "1234",
      style: "FIBONACCI",
    });
    await joinRoom(participant.id, room.id, "1234");
    await addTask(admin.id, room.id, "First", "https://example.com/first");
    await addTask(admin.id, room.id, "Second", "https://example.com/second");
    await expect(
      castVote(participant.id, room.id, "999"),
    ).rejects.toMatchObject({ code: "INVALID_VOTE" });
    await castVote(participant.id, room.id, "5");
    await castVote(participant.id, room.id, "8");
    const [round] = await db
      .select()
      .from(votingRounds)
      .orderBy(votingRounds.createdAt);
    const storedVotes = await db
      .select()
      .from(votes)
      .where(eq(votes.roundId, round.id));
    expect(storedVotes).toHaveLength(1);
    expect(storedVotes[0].value).toBe("8");
    const race = await Promise.allSettled([
      castVote(participant.id, room.id, "13"),
      revealVotes(admin.id, room.id),
    ]);
    expect(race.some((result) => result.status === "fulfilled")).toBe(true);
    await expect(castVote(participant.id, room.id, "21")).rejects.toMatchObject(
      { code: "ROUND_CLOSED" },
    );
    const restartRace = await Promise.allSettled([
      restartRound(admin.id, room.id),
      restartRound(admin.id, room.id),
    ]);
    expect(
      restartRace.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(2);
    const rounds = await db
      .select()
      .from(votingRounds)
      .where(eq(votingRounds.taskId, round.taskId));
    expect(rounds.filter((item) => item.status === "OPEN")).toHaveLength(1);
    expect(rounds.map((item) => item.sequence).sort()).toEqual([1, 2, 3]);
    await castVote(participant.id, room.id, "13");
    await revealVotes(admin.id, room.id);
    const completionRace = await Promise.allSettled([
      completeTask(admin.id, room.id, "13"),
      completeTask(admin.id, room.id, "13"),
    ]);
    expect(
      completionRace.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const projection = await roomProjection(room.id, participant.id);
    expect(
      projection.tasks.filter((task) => task.status === "VOTING"),
    ).toHaveLength(1);
    expect(
      projection.participants.find((item) => item.userId === participant.id)
        ?.hasVoted,
    ).toBe(false);
  });
  it("makes finalized rooms immutable and completes every remaining task", async () => {
    const [admin, participant, outsider] = await db
      .insert(users)
      .values([
        { email: "finish-admin@example.com", name: "Admin" },
        { email: "finish-member@example.com", name: "Member" },
        { email: "finish-outsider@example.com", name: "Outsider" },
      ])
      .returning();
    const room = await createRoom(admin.id, {
      name: "Finished",
      slug: "done",
      password: "1234",
      style: "SCRUM",
    });
    await joinRoom(participant.id, room.id, "1234");
    await addTask(
      admin.id,
      room.id,
      "Completed",
      "https://example.com/completed",
    );
    await addTask(admin.id, room.id, "Pending", "https://example.com/pending");
    await castVote(participant.id, room.id, "5");
    await revealVotes(admin.id, room.id);
    await completeTask(admin.id, room.id);
    const pending = (
      await db.select().from(tasks).where(eq(tasks.roomId, room.id))
    ).find((task) => task.status === "VOTING")!;
    await finishRoom(admin.id, room.id);
    for (const operation of [
      () => joinRoom(outsider.id, room.id, "1234"),
      () => castVote(participant.id, room.id, "8"),
      () =>
        addTask(admin.id, room.id, "Blocked", "https://example.com/blocked"),
      () =>
        editTask(
          admin.id,
          room.id,
          pending.id,
          "Blocked",
          "https://example.com/blocked",
        ),
      () => removeTask(admin.id, room.id, pending.id),
      () => reorderTasks(admin.id, room.id, [pending.id]),
      () => revealVotes(admin.id, room.id),
      () => restartRound(admin.id, room.id),
      () => completeTask(admin.id, room.id),
    ])
      await expect(operation()).rejects.toMatchObject({
        code: "ROOM_FINISHED",
      });
    const summary = await roomSummary(room.id);
    expect(summary.tasks[0].status).toBe("COMPLETED");
    expect(summary.tasks[0].finalResult).toBeNull();
    expect(summary.tasks[0].rounds[0].votes[0].value).toBe("5");
    expect(summary.tasks[1].status).toBe("COMPLETED");
    expect(summary.tasks[1].finalResult).toBeNull();
  });
});
