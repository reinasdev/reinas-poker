CREATE TYPE "public"."room_status" AS ENUM('ACTIVE', 'FINISHED');--> statement-breakpoint
CREATE TYPE "public"."round_status" AS ENUM('OPEN', 'REVEALED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('PENDING', 'VOTING', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."voting_style" AS ENUM('SCRUM', 'FIBONACCI', 'TSHIRT');--> statement-breakpoint
CREATE TABLE "magic_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(6) NOT NULL,
	"password_hash" text NOT NULL,
	"style" "voting_style" NOT NULL,
	"status" "room_status" DEFAULT 'ACTIVE' NOT NULL,
	"admin_id" uuid NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"link" text NOT NULL,
	"position" integer NOT NULL,
	"status" "task_status" DEFAULT 'PENDING' NOT NULL,
	"final_result" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"value" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"status" "round_status" DEFAULT 'OPEN' NOT NULL,
	"revealed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_round_id_voting_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."voting_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_participant_id_room_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."room_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_rounds" ADD CONSTRAINT "voting_rounds_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "magic_codes_email_created_idx" ON "magic_codes" USING btree ("email","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_room_user_unique" ON "room_participants" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "participants_room_idx" ON "room_participants" USING btree ("room_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_slug_lower_unique" ON "rooms" USING btree (lower("slug"));--> statement-breakpoint
CREATE INDEX "rooms_admin_idx" ON "rooms" USING btree ("admin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_room_position_unique" ON "tasks" USING btree ("room_id","position");--> statement-breakpoint
CREATE INDEX "tasks_room_status_idx" ON "tasks" USING btree ("room_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "votes_round_participant_unique" ON "votes" USING btree ("round_id","participant_id");--> statement-breakpoint
CREATE INDEX "votes_round_idx" ON "votes" USING btree ("round_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rounds_task_sequence_unique" ON "voting_rounds" USING btree ("task_id","sequence");--> statement-breakpoint
CREATE INDEX "rounds_task_status_idx" ON "voting_rounds" USING btree ("task_id","status");