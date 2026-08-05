# Viewings AI Chat Demo — Client

Vite + React + TypeScript frontend for the Viewings listing chat demo. Uses Editorial Theme 02, Redux Toolkit, and typed REST clients against the Express API.

## Prerequisites

- Node.js 20+
- Backend API running (see `../server`)

## Setup

```bash
cd client
cp .env.example .env
npm install
```

Set `VITE_API_URL` in `.env` to your API origin, for example `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Preview production build |

## Demo accounts

| Email | Role | Password (seed default) |
|-------|------|-------------------------|
| seeker@viewings.demo | Seeker | DemoPass123! |
| lister@viewings.demo | Lister | DemoPass123! |
| admin@viewings.demo | Demo admin | DemoPass123! |

## Routes

- `/login` — email/password auth
- `/` — property grid + ⌘K / Ctrl+K search
- `/properties/:propertyId` — listing detail
- `/chat/:propertyId` — full-page chat with evidence sidebar
- `/bookings` — my bookings
- `/bookings/:bookingId` — booking confirmation
- `/lister/questions` — lister inbox
- `/demo` — demo control panel (admin)

## Evidence sidebar

Chat includes E-01 through E-11 chips from the implementation plan. Chips that need a fixture property attempt to jump to a listing whose `fixtureKey` matches the seed metadata.

## Notes

- All marketplace routes are auth-gated.
- API responses are expected in `{ success, message, data }` shape.
- If the backend is not running, pages show loading and empty states without crashing.
