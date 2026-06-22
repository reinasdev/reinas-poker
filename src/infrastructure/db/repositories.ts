import { and, eq, sql } from "drizzle-orm";
import { db } from "./client";
import { roomParticipants, rooms, users } from "./schema";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DatabaseExecutor = typeof db | Transaction;

export const repositories = {
  transaction: <T>(work: (tx: Transaction) => Promise<T>) => db.transaction(work),
  async lockRoom(tx: Transaction, roomId: string) {
    await tx.execute(sql`select id from rooms where id = ${roomId} for update`);
  },
  async findRoom(executor: DatabaseExecutor, roomId: string) {
    const [room] = await executor.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    return room ?? null;
  },
  async findMembership(executor: DatabaseExecutor, roomId: string, userId: string) {
    const [membership] = await executor
      .select()
      .from(roomParticipants)
      .where(and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, userId)))
      .limit(1);
    return membership ?? null;
  },
  async createUser(executor: DatabaseExecutor, email: string, name = "Test User") {
    const [user] = await executor.insert(users).values({ email, name }).returning();
    return user;
  },
};
