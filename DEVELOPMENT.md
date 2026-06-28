# Development

Technical guide for running and validating Planning Poker locally.

## Prerequisites

- Docker Desktop with Docker Compose
- Make, or equivalent `docker compose` commands
- Node.js only if running the app outside Docker

## Local Environment

1. Copy `.env.example` to `.env`. Local values are not production secrets.
2. Run `make dev`.
3. Open the app at http://localhost:3000.
4. Open Mailpit at http://localhost:8025 to read magic-code emails.

`make dev` starts PostgreSQL and Mailpit, waits for the database healthcheck, applies versioned migrations, and starts the app. The regular `npm run dev` command does not modify the database schema.

## Commands

| Command               | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `make dev`            | Install through Docker, migrate, and start the app          |
| `make infra`          | Start only PostgreSQL and Mailpit                           |
| `make generate`       | Generate a Drizzle migration after schema changes           |
| `make migrate`        | Apply versioned migrations                                  |
| `npm run db:validate` | Validate migrations from empty and previous database states |
| `make studio`         | Open Drizzle Studio                                         |
| `make logs`           | Follow container logs                                       |
| `make down`           | Stop containers while preserving data                       |
| `make reset`          | Remove containers and the PostgreSQL volume                 |
| `make test`           | Run tests inside the app container                          |

`docker compose up --build` is a low-level operation and does not replace `make migrate`.

## Running Without Docker for the App

With PostgreSQL and Mailpit already available:

```bash
npm install
npm run db:migrate
npm run dev
```

## Migrations

Schema changes must use Drizzle Kit:

1. Change `src/infrastructure/db/schema.ts`.
2. Run `make generate` or `npm run db:generate -- --name migration_name`.
3. Review the SQL generated in `drizzle/`.
4. Commit schema, SQL, `drizzle/meta/`, and related config together.
5. Run `make migrate`.

Do not edit already integrated migrations. Create a corrective migration instead. Do not create tables, enums, indexes, or constraints manually. Seeds are optional and never create schema. `drizzle-kit push` is not used in development, CI, staging, or production.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Before the first E2E run, install Chromium:

```bash
npm run test:e2e:install
```

With the app already running, set `PLAYWRIGHT_BASE_URL=http://localhost:3000` to reuse it during Playwright runs.

## Manual Smoke Flow

1. Request email access and copy the six-digit code from Mailpit.
2. Complete the first-access display name.
3. Create a room with slug, four-digit password, and deck.
4. In another authenticated session, open the slug and join with the password or invite link.
5. As admin, add and reorder tasks.
6. Vote in both sessions and confirm votes are hidden before reveal.
7. Reveal, restart a round, and confirm previous history is preserved.
8. Complete a task with or without a result.
9. Finish the room and confirm the read-only summary.
10. Restart containers without removing the volume and confirm persisted data remains.

## Architecture

- `src/domain`: validation, voting decks, errors, and safe projections.
- `src/application`: auth and room use cases; authorization is enforced server-side.
- `src/infrastructure`: PostgreSQL/Drizzle, hashing, SMTP/Mailpit, and SSE publisher.
- `src/app`: App Router pages and route handlers.

SSE only transports invalidation events; clients reload authorized projections. Writes use HTTP. The publisher can be replaced later for shared infrastructure.

## Deployment Notes

Run versioned migrations before routing traffic to a new release. Migration failures must stop deployment. Application rollback should preserve data; destructive changes require their own migration and recovery plan.
