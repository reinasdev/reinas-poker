import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const roomStatus = pgEnum("room_status", ["ACTIVE", "FINISHED"]);
export const votingStyle = pgEnum("voting_style", [
  "SCRUM",
  "FIBONACCI",
  "TSHIRT",
]);
export const taskStatus = pgEnum("task_status", [
  "PENDING",
  "VOTING",
  "COMPLETED",
]);
export const roundStatus = pgEnum("round_status", [
  "OPEN",
  "REVEALED",
  "CLOSED",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 320 }).notNull(),
    name: varchar("name", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_lower_unique").on(sql`lower(${t.email})`)],
);
export const magicCodes = pgTable(
  "magic_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 320 }).notNull(),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("magic_codes_email_created_idx").on(t.email, t.createdAt)],
);
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_unique").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 6 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    accessCode: varchar("access_code", { length: 4 }),
    style: votingStyle("style").notNull(),
    status: roomStatus("status").notNull().default("ACTIVE"),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => users.id),
    version: integer("version").notNull().default(0),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("rooms_slug_lower_unique").on(sql`lower(${t.slug})`),
    index("rooms_admin_idx").on(t.adminId),
  ],
);
export const roomParticipants = pgTable(
  "room_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("participants_room_user_unique").on(t.roomId, t.userId),
    index("participants_room_idx").on(t.roomId),
  ],
);
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    link: text("link").notNull(),
    position: integer("position").notNull(),
    status: taskStatus("status").notNull().default("PENDING"),
    finalResult: varchar("final_result", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("tasks_room_position_unique").on(t.roomId, t.position),
    index("tasks_room_status_idx").on(t.roomId, t.status),
  ],
);
export const votingRounds = pgTable(
  "voting_rounds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    status: roundStatus("status").notNull().default("OPEN"),
    revealedAt: timestamp("revealed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("rounds_task_sequence_unique").on(t.taskId, t.sequence),
    index("rounds_task_status_idx").on(t.taskId, t.status),
  ],
);
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => votingRounds.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => roomParticipants.id, { onDelete: "cascade" }),
    value: varchar("value", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("votes_round_participant_unique").on(
      t.roundId,
      t.participantId,
    ),
    index("votes_round_idx").on(t.roundId),
  ],
);
