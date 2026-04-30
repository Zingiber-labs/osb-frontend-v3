# CLAUDE.md — outer-sports-baller-v3

Frontend for Outer Sports Ballers, a multiplayer basketball game. Next.js 15 (App Router) + React 19 web client. Talks to a separate backend API via a BFF proxy — the browser never sees backend URLs or tokens.

## Tech Stack

- **Next.js 15.5** App Router, React 19, TypeScript strict
- **TanStack Query 5** for all data fetching and mutations
- **react-hook-form + zod** for forms (`@hookform/resolvers/zod`)
- **Tailwind 4 + shadcn/ui (new-york style) + Radix** for UI; Lucide icons
- **Three.js + @react-three/fiber + @react-three/drei** for the gameplay scene
- **socket.io-client** for realtime
- **react-hot-toast** for notifications
- Auth: custom BFF + HttpOnly cookies (NO NextAuth, NO axios, NO localStorage tokens)

## Build & Run

```bash
npm run dev         # dev server on :3000
npm run build       # production build (type errors fail the build)
npm run start       # serve production build
npm run lint        # next lint (warnings only)
npx tsc --noEmit    # type check
```

Required env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`.

No tests yet. If adding any, use Vitest for unit and Playwright for E2E.

## Project Structure

- `src/app/(auth)/` — public login/signup pages
- `src/app/(main)/` — authed app shell. Layout is RSC and `await getSession()`; redirects to `/login` if null
- `src/app/(gameplay)/` — full-bleed Three.js scene; same RSC auth gate
- `src/app/api/auth/*/route.ts` — BFF auth: `login`, `signup`, `logout`, `me`, `guest`, `callback`
- `src/app/api/backend/[...path]/route.ts` — BFF data proxy (forwards everything with `Bearer osb_at`)
- `src/app/providers.tsx` — single root QueryClient + `SessionHydrator`
- `src/lib/auth/` — `schemas.ts` (zod), `cookies.ts` (osb_at/osb_rt), `session.ts` (server-only `getSession`), `client.ts` (mutations)
- `src/lib/api/client.ts` — fetch wrapper, axios-shaped (`api.get/post/...`)
- `src/hooks/useSession.ts` — TanStack Query hook against `/api/auth/me`
- `src/middleware.ts` — cookie-based route protection
- `src/components/<feature>/` — feature-grouped React components
- `src/components/ui/` — shadcn primitives (don't hand-edit; regenerate via `npx shadcn@latest add`)

## Auth (read this before touching anything auth-adjacent)

1. Tokens live ONLY in `HttpOnly` cookies set by Next.js Route Handlers. Browser JS never sees them.
2. Backend call from a hook: `api.get('/missions')` → fetch wrapper rewrites to `/api/backend/missions` → BFF reads `osb_at` cookie → forwards to backend with `Authorization: Bearer <token>`.
3. Server Components read session via `await getSession()` from `@/lib/auth/session` (cached per-request).
4. Client Components read session via `useSession()` from `@/hooks/useSession` (returns `{ data: User | null, isLoading, ... }`). RSC layouts hydrate the cache, so first paint has data.
5. Mutations: `useLogin`, `useSignup`, `useLogout`, `useGuestLogin`, `startGoogleLogin` from `@/lib/auth/client`.
6. NEVER reintroduce: `next-auth/react`, `@/contexts/AuthContext`, `@/lib/axios`, `@/lib/auth.ts`, `localStorage` for tokens, `document.cookie` for tokens. They're gone for security reasons (XSS).

Cookie names: `osb_at` (access, Path=/), `osb_rt` (refresh, Path=/api/auth, scoped). Legacy `access_token` cookie is accepted by middleware for one-deploy cutover only.

## Code Style

- File naming: `PascalCase.tsx` for components, `camelCase.ts` for hooks/utils/schemas
- Imports: prefer `@/*` (alias to `src/*`) for cross-feature; relative for siblings
- Forms: always wire `useForm` with `zodResolver(SomeSchema)`. Don't hand-roll regex validation
- Data: never call `fetch` directly from components — use `api` from `@/lib/api/client` or a TanStack `useQuery`
- Errors in API routes: `return NextResponse.json({ error: "..." }, { status: 4xx/5xx })`
- Errors in mutations: surface via `mutation.error.message` in the UI; don't swallow
- TypeScript: strict on, `any` allowed (rule disabled), but prefer typed where cheap. **`ignoreBuildErrors` is OFF** — type errors fail the build, fix them before merging
- Three.js assets: `useMemo` once per canvas — never recreate per render

## When you make changes

- Adding a new backend-consuming hook: import `api` from `@/lib/api/client` (NOT `@/lib/axios` — deleted). Use `api.get<T>('/path')` returning `{ data, status, headers }`
- Adding a protected page: drop it under `src/app/(main)/` and the layout enforces auth automatically
- Touching session shape: change `UserSchema` and `normalizeProfile` in `src/lib/auth/schemas.ts`. Downstream `User` type propagates
- Adding a UI primitive: `npx shadcn@latest add <component>` — don't write Radix wrappers from scratch
- Adding a backend endpoint passthrough: nothing to do — `/api/backend/[...path]` already proxies it. Just call `api.get('/your/path')`


## Known limitations (don't reintroduce these as fixes)

- No `/auth/refresh` endpoint yet (backend) — session lives until `osb_at` expires, then user re-logs in. Don't fake it on the frontend
- Google OAuth backend redirects with `?token=JWT` in URL (server logs/history leak). Mitigated server-side via `/api/auth/callback` Route Handler. Real fix is a backend POST/code-exchange flow
- No `redirectUrl` allowlist on backend `/auth/google` — coordinate with backend team for that
