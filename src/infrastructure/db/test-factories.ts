import { randomUUID } from "node:crypto";
import type { DatabaseExecutor } from "./repositories";
import { roomParticipants, rooms, users } from "./schema";

let sequence = 0;

/**
 * O `id` é obrigatório porque a tabela é um espelho do reinas-id:
 * quem gera identificadores de usuário é sempre o serviço de identidade.
 */
export async function userFactory(
  executor: DatabaseExecutor,
  overrides: Partial<typeof users.$inferInsert> = {},
) {
  sequence += 1;
  const [user] = await executor
    .insert(users)
    .values({
      id: randomUUID(),
      email: `user-${sequence}-${randomUUID().slice(0, 8)}@example.test`,
      name: `User ${sequence}`,
      ...overrides,
    })
    .returning();
  return user;
}

export async function roomFactory(
  executor: DatabaseExecutor,
  adminId: string,
  overrides: Partial<typeof rooms.$inferInsert> = {},
) {
  sequence += 1;
  const [room] = await executor
    .insert(rooms)
    .values({
      name: `Room ${sequence}`,
      slug: `r${sequence}`.slice(-6),
      passwordHash: "test-only-hash",
      accessCode: "1234",
      style: "SCRUM",
      adminId,
      ...overrides,
    })
    .returning();
  await executor
    .insert(roomParticipants)
    .values({ roomId: room.id, userId: adminId });
  return room;
}
