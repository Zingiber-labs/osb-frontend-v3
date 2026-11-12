# Outer Sports Ballers — Web Client

Frontend for **Outer Sports Ballers**, a multiplayer basketball-themed game. Players accept missions, watch the gameplay scene (PixiJS, from `@osb/gameplay`), claim rewards, and progress through inventory, hangar, and locker-room systems.

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
| Gameplay scene | `@osb/gameplay` (workspace package, PixiJS) |
| Realtime | socket.io-client |
| Notifications | react-hot-toast |
| Auth | Custom BFF + HttpOnly cookies (no NextAuth, no localStorage tokens) |
| Deployment | Caprover (Docker via `captain-definition` + `dockerfile`) |

---

## Getting Started

### Prerequisites

- Node.js 22
- npm (the repo uses `package-lock.json`)
- Access to the backend API (`NEXT_PUBLIC_API_URL`)

### Setup

This app lives in the OSB monorepo (`apps/web`); install and run it from the repo root.

```bash
git clone git@github.com:Zingiber-labs/osb-frontend-v3.git
cd osb-frontend-v3
npm ci            # at the monorepo root (npm workspaces)
npm run dev:web   # dev server on http://localhost:3000
```

Create `apps/web/.env` (see `.env.example`):

- `NEXT_PUBLIC_API_URL` — public backend URL
- `NEXT_PUBLIC_SOCKET_URL` — public socket.io endpoint (gameplay play-by-play)
- `BACKEND_API_URL` — optional, server-side override: private backend URL used only by Next.js on the server
- `NEXT_PUBLIC_GAMEPLAY_FEED` — dev only: `replay` drives `/game-play` from the recorded fixture instead of the socket

### Run

From the repo root:

```bash
npm run dev:web                  # dev server on http://localhost:3000
npm run build:web                # production build (type errors fail the build)
npm run start -w apps/web        # serve production build
npm run test -w apps/web         # vitest + Testing Library
npm run typecheck -w apps/web    # type check
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

A guided code tour is available at [`.tours/new-joiner-architecture.tour`](../../.tours/new-joiner-architecture.tour) at the repo root — open it with the [CodeTour](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour) VS Code extension. Its file paths predate the move into `apps/web`, so prefix them with `apps/web/`.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                # public login / signup pages
│   ├── (main)/                # authed app shell (RSC layout enforces auth)
│   ├── (gameplay)/            # full-bleed gameplay scene
│   ├── api/auth/              # BFF auth: login, signup, logout, me, guest, callback
│   ├── api/backend/[...path]/ # BFF data proxy
│   ├── layout.tsx             # root layout
│   └── providers.tsx          # QueryClient + SessionHydrator
├── components/<feature>/      # UI grouped by feature
├── components/ui/             # shadcn primitives
├── hooks/                     # shared hooks
├── lib/
│   ├── api/client.ts          # fetch wrapper, hits /api/backend
│   └── auth/                  # schemas, cookies, session, mutations
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

Conventions: see `CLAUDE.md` in this folder.

---

## Deployment

This repo deploys via **Caprover**. The captain config (`captain-definition`) points at the `dockerfile` at the repo root, which builds a production Next.js image.

Required env on the deploy target:

- `NEXT_PUBLIC_API_URL` — public backend URL for browser redirects, including Google login; supplied when building the image
- `NEXT_PUBLIC_SOCKET_URL` — public socket.io endpoint; supplied when building the image
- `BACKEND_API_URL` — optional private backend URL for server-side auth routes, the BFF proxy and RSC sessions; supplied at runtime. Falls back to `NEXT_PUBLIC_API_URL` when unset.

The VPS Compose configuration sets `BACKEND_API_URL=http://osb-be:8080`. Both containers must share the `proxy` Docker network so Next.js can reach the backend without going through the public domain. Browser URLs remain public.

When deploying this change, update `docker-compose.prod.yml` on the VPS as well as the frontend image. The current deployment workflow pulls the image and uses the Compose file already on the server; it does not copy repository changes to that file. Recreate the frontend container to apply runtime environment changes.

---

## Conventions

- **Commits**: emoji-prefixed conventional style — `🐛 fix ...`, `💄 design ...`, `✨ feat ...`, `♻️ refactor ...`, `📝 docs ...`
- **Branches**: feature work merges into `develop`; production cuts come from `main`
- **TypeScript**: strict mode is on, `any` is tolerated in legacy code only; new feature code is fully typed, `ignoreBuildErrors` is OFF — fix type errors before merging
- **No NextAuth, no axios, no localStorage tokens** — all three were removed during the BFF auth rewrite. See `CLAUDE.md` for the full list of legacy patterns to avoid

---

## Known Limitations

- **No `/auth/refresh` endpoint** on the backend yet — sessions live until `osb_at` expires, then the user re-logs in
- **Google OAuth** still receives the JWT as a URL query param on the backend redirect; the Next.js callback handler stores it server-side immediately, but the URL is briefly visible in browser history. Backend should switch to a POST callback or code-exchange flow
- **No `redirectUrl` allowlist** on backend `/auth/google` — coordinate with backend team
- Tests: Vitest + Testing Library (`npm run test -w apps/web`)

---

## License

Proprietary — Zingiber Labs.
