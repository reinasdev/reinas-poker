ALTER TABLE "magic_codes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "magic_codes" CASCADE;--> statement-breakpoint
DROP TABLE "sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "synced_at" timestamp with time zone DEFAULT now() NOT NULL;