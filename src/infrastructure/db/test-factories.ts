import type { DatabaseExecutor } from "./repositories";
import { roomParticipants, rooms, users } from "./schema";

let sequence = 0;

export async function userFactory(executor: DatabaseExecutor, overrides: Partial<typeof users.$inferInsert> = {}) {
  sequence += 1;
  const [user] = await executor.insert(users).values({
    email: `user-${sequence}@example.test`,
    name: `User ${sequence}`,
    ...overrides,
  }).returning();
  return user;
}

export async function roomFactory(
  executor: DatabaseExecutor,
  adminId: string,
  overrides: Partial<typeof rooms.$inferInsert> = {},
) {
  sequence += 1;
  const [room] = await executor.insert(rooms).values({
    name: `Room ${sequence}`,
    slug: `r${sequence}`.slice(-6),
    passwordHash: "test-only-hash",
    style: "SCRUM",
    adminId,
    ...overrides,
  }).returning();
  await executor.insert(roomParticipants).values({ roomId: room.id, userId: adminId });
  return room;
}
