# Viewings AI Chat System Demo — Server

Express + TypeScript + Prisma backend for the Viewings listing chat demo.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or remote)

## Setup

```bash
cd server
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, and OPENAI_API_KEY

npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload (port 3000) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations (dev) |
| `npm run prisma:migrate:deploy` | Deploy migrations (prod) |
| `npm run seed` | Idempotent demo seed |

## Environment

See `.env.example`. Required:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — min 16 characters
- `OPENAI_API_KEY` — required for live chat turns
- `OPENAI_MODEL` — defaults to `gpt-5.6-luna`
- `TZ=Pacific/Auckland`

## Demo accounts (seeded)

| Email | Role | Password |
|-------|------|----------|
| seeker@viewings.demo | SEEKER | From `DEMO_PASSWORD` |
| lister@viewings.demo | LISTER | From `DEMO_PASSWORD` |
| admin@viewings.demo | DEMO_ADMIN | From `DEMO_PASSWORD` |

Default password: `DemoPass123!`

## API overview

Base URL: `http://localhost:3000`

- `POST /api/auth/login` — JWT login (rate limited)
- `GET /api/auth/me` — current user
- `GET /api/properties` — list/search listings
- `GET /api/properties/:id` — property detail
- `GET /api/properties/:id/availability` — viewing slots
- `GET /api/chat/sessions/:propertyId` — get/create session
- `GET /api/chat/sessions/:sessionId/messages` — message history
- `POST /api/chat/sessions/:sessionId/messages` — AI turn (rate limited)
- `POST /api/bookings` — create booking
- `GET /api/bookings` — my bookings
- `POST /api/bookings/:id/cancel` — cancel booking
- `GET /api/lister/questions` — lister inbox
- `POST /api/lister/questions/:id/answer` — answer + memory
- `POST /api/leads/contact` — capture lead
- `POST /api/leads/callback` — callback request
- `GET /api/demo/turns/:sessionId` — turn logs
- `GET /api/demo/fixtures` — evidence fixture map

All routes except login and health require `Authorization: Bearer <token>`.

## Evidence fixtures (seed `fixtureKey`)

| Key | Evidence |
|-----|----------|
| unfurnished-rental | E-02 |
| yard-fencing-unknown | E-03 |
| ensuite-layout | E-04 |
| heating-fixture | E-05 |
| accessibility-unknown | E-06, E-08, E-09 |
| sale-pets | E-07 |
| rent-wfh | E-11 |

## Without local PostgreSQL

You can still generate the schema and seed script. Point `DATABASE_URL` at any reachable PostgreSQL instance (Docker, Neon, Supabase, etc.) before running migrate/seed.

```bash
docker run --name viewings-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=viewings_chat -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/viewings_chat?schema=public
```

## Architecture

MVC modules under `src/modules/`: auth, users, properties, chat, bookings, lister, leads, demo.

OpenAI tool-calling agent in `src/services/ai/` with DB-backed tools (no invented facts).

Soft delete via `deletedAt` on primary models; default queries exclude deleted rows.
