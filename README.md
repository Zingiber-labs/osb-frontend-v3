# Outer Sports Ballers — Web Client

Frontend for **Outer Sports Ballers**, a multiplayer basketball-themed game. Players accept missions, run a Three.js gameplay scene, claim rewards, and progress through inventory, hangar, and locker-room systems.

This is a Next.js 15 (App Router) + React 19 client. It is fully decoupled from a separate backend API — all backend traffic flows through a Backend-for-Frontend proxy, so the browser never sees backend URLs or JWTs.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Data | TanStack Query 5 |
| Forms | react-hook-form + Zod (`@hookform/resolvers/zod`) |
| Styling | Tailwind 4 + shadcn/ui (new-york) + Radix |
| Icons | Lucide |
| 3D | Three.js + `@react-three/fiber` + `@react-three/drei` |
| Realtime | socket.io-client |
| Notifications | react-hot-toast |
| Auth | Custom BFF + HttpOnly cookies (no NextAuth, no localStorage tokens) |
| Deployment | Caprover (Docker via `captain-definition` + `dockerfile`) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (the repo uses `package-lock.json`)
- Access to the backend API (`NEXT_PUBLIC_API_URL`)

### Setup

```bash
git clone git@github.com:Zingiber-labs/osb-frontend-v3.git
cd osb-frontend-v3
npm install
```

Create a `.env.local` at the repo root:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.example.com
NEXT_PUBLIC_SOCKET_URL=https://your-backend.example.com
```

### Run

```bash
npm run dev          # dev server on http://localhost:3000
npm run build        # production build (type errors fail the build)
npm run start        # serve production build
npm run lint         # next lint
npx tsc --noEmit     # type check
```

---

## Architecture (high level)

```
Browser ──fetch──> Next.js Route Handlers (BFF) ──fetch + Bearer──> Backend API
   │                       │
   │                       ├── reads HttpOnly cookie `osb_at`
   │                       ├── auth routes set/clear HttpOnly cookies
   │                       └── 401 → clears cookies, returns 401
   │
   └── client only sees /api/auth/* and /api/backend/*
```

- **Tokens** live exclusively in HttpOnly cookies (`osb_at`, `osb_rt`) set by Next.js Route Handlers. Browser JS never sees them.
- **Server Components** read the session via `getSession()` from `@/lib/auth/session` (cached per-request).
- **Client Components** read the session via `useSession()` from `@/hooks/useSession` (TanStack Query against `/api/auth/me`, hydrated by RSC layouts).
- **All backend data calls** go through `/api/backend/[...path]` — the BFF proxy reads the auth cookie and forwards the request with `Authorization: Bearer <token>`.
- **Auth mutations** (`useLogin`, `useSignup`, `useLogout`, `useGuestLogin`, `startGoogleLogin`) live in `@/lib/auth/client`.

A guided code tour is available at [`.tours/new-joiner-architecture.tour`](.tours/new-joiner-architecture.tour) — open it with the [CodeTour](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour) VS Code extension.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                # public login / signup pages
│   ├── (main)/                # authed app shell (RSC layout enforces auth)
│   ├── (gameplay)/            # full-bleed Three.js scene
│   ├── api/auth/              # BFF auth: login, signup, logout, me, guest, callback
│   ├── api/backend/[...path]/ # BFF data proxy
│   ├── layout.tsx             # root layout
│   └── providers.tsx          # QueryClient + SessionHydrator
├── components/<feature>/      # UI grouped by feature
├── components/ui/             # shadcn primitives
├── hooks/                     # data + Three.js hooks
├── lib/
│   ├── api/client.ts          # fetch wrapper, hits /api/backend
│   ├── auth/                  # schemas, cookies, session, mutations
│   └── three/                 # Three.js asset/scene helpers
├── types/                     # shared TS types
└── middleware.ts              # cookie-based route protection
```

---

## Common Tasks

| I want to... | Do this |
|---|---|
| Add a backend-consuming hook | Import `api` from `@/lib/api/client`, call `api.get('/your/path')` |
| Add a protected page | Drop a `page.tsx` under `src/app/(main)/<route>/` — auth handled by the layout |
| Add an unauthed page | Drop a `page.tsx` under `src/app/(auth)/<route>/` |
| Add a UI primitive | `npx shadcn@latest add <component>` |
| Touch session shape | Edit `UserSchema` and `normalizeProfile` in `src/lib/auth/schemas.ts` |
| Modify route protection | Edit `PUBLIC_ROUTES` in `src/middleware.ts` |

For Claude Code / AI-assisted development conventions, see [`CLAUDE.md`](CLAUDE.md) at the repo root.

---

## Deployment

This repo deploys via **Caprover**. The captain config (`captain-definition`) points at the `dockerfile` at the repo root, which builds a production Next.js image.

Required env on the deploy target:

- `NEXT_PUBLIC_API_URL` — backend API base URL (must be reachable from the Next.js server, since RSC `getSession()` calls it)
- `NEXT_PUBLIC_SOCKET_URL` — socket.io endpoint

---

## Conventions

- **Commits**: emoji-prefixed conventional style — `🐛 fix ...`, `💄 design ...`, `✨ feat ...`, `♻️ refactor ...`, `📝 docs ...`
- **Branches**: feature work merges into `develop`; production cuts come from `main`
- **TypeScript**: strict mode is on, `any` is allowed (eslint rule disabled), `ignoreBuildErrors` is OFF — fix type errors before merging
- **No NextAuth, no axios, no localStorage tokens** — all three were removed during the BFF auth rewrite. See `CLAUDE.md` for the full list of legacy patterns to avoid

---

## Known Limitations

- **No `/auth/refresh` endpoint** on the backend yet — sessions live until `osb_at` expires, then the user re-logs in
- **Google OAuth** still receives the JWT as a URL query param on the backend redirect; the Next.js callback handler stores it server-side immediately, but the URL is briefly visible in browser history. Backend should switch to a POST callback or code-exchange flow
- **No `redirectUrl` allowlist** on backend `/auth/google` — coordinate with backend team
- **No tests yet** — Vitest + Playwright recommended for follow-up

---

## License

Proprietary — Zingiber Labs.
