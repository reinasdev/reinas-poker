# Planning Poker

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-20232a?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-migrations-c5f74f)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2ead33?logo=playwright&logoColor=white)

Planning Poker is a dark-first, developer-focused estimation room for agile teams. It combines real-time collaborative voting, secure magic-code authentication, protected rooms, task queues, vote reveal flows, and final read-only summaries in a technical interface inspired by terminals, observability dashboards, and engineering tools.

Built with Next.js App Router, PostgreSQL, Drizzle ORM, Server-Sent Events, Tailwind CSS, shadcn-style primitives, JetBrains Mono, and Font Awesome.

## Highlights

- Real-time Planning Poker rooms with Scrum, Fibonacci, and T-shirt decks.
- Magic-code login by email with profile onboarding.
- Protected rooms with four-digit access codes and invite links using `?senha=`.
- Admin workflow for task queue management, reveal, restart, complete, and finish.
- Participant-safe projections: hidden votes stay hidden until reveal.
- Developer-first visual system with dark/light grayscale themes, technical labels, badges, QR code sharing, and responsive layouts.
- Room history and final summary for completed sessions.
- Docker-first local environment with PostgreSQL and Mailpit.
- Automated quality gates with lint, typecheck, unit/integration tests, E2E tests, build, and migration validation.

## Product Flow

1. Request a magic code by email.
2. Complete your display name on first access.
3. Create a room with a slug, password, and voting deck.
4. Share the room link, access code, or QR code.
5. Add tasks, vote privately, reveal estimates, and complete rounds.
6. Finish the room and keep a read-only summary of the session.

## Tech Stack

| Layer    | Tools                                                               |
| -------- | ------------------------------------------------------------------- |
| App      | Next.js App Router, React, TypeScript                               |
| UI       | Tailwind CSS, shadcn-style primitives, JetBrains Mono, Font Awesome |
| Data     | PostgreSQL, Drizzle ORM, versioned migrations                       |
| Auth     | Magic code email flow, hashed tokens, secure cookies                |
| Realtime | Server-Sent Events with authorized projection refresh               |
| Infra    | Docker Compose, Mailpit                                             |
| Quality  | ESLint, TypeScript, Vitest, Playwright                              |

## Quick Start

```bash
cp .env.example .env
make dev
```

Open:

- App: http://localhost:3000
- Mailpit: http://localhost:8025

For detailed setup, commands, migrations, tests, and local development notes, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Documentation

- [Development guide](./DEVELOPMENT.md)
- [Security policy](./SECURITY.md)
- [OpenSpec specs](./openspec/specs)

## License

Private project.
