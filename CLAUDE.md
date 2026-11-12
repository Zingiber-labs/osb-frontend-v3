# CLAUDE.md — OSB monorepo

npm workspaces, Node 22. Run commands from the root with `-w <workspace>` or use the root scripts.

| Workspace | Path | What |
|---|---|---|
| `@osb/web` | `apps/web` | Product: Next.js 15 player app (auth, missions, hangar, store, gameplay route). Own CLAUDE.md. |
| `@osb/gameplay` | `packages/gameplay` | Framework-free ship-scenario gameplay: engine, feeds, PixiJS renderer, HUD. Consumed as source. |
| `@osb/sandbox` | `apps/sandbox` | Vite dev app: `/sandbox` (renderer tuning) and `/reglas` (Spanish rules). Own CLAUDE.md. |

```bash
npm run dev:web        # :3000
npm run dev:sandbox    # :5173
npm test               # vitest in every workspace
npm run typecheck
npm run lint           # oxlint, root config .oxlintrc.json
npm run build:web
```

Rules
- `packages/gameplay` never imports from `next`, `react-router`, or `apps/*`. Relative imports only inside it. Public API is `src/index.ts`.
- Backend data enters gameplay through a `Feed` (`apps/web/src/features/gameplay/liveFeed.ts` for the socket, package replay feed for fixtures). Socket contract: `docs/backend/play-by-play-contract.md`.
- Rebuild standard for web features: `apps/web/src/features/<name>/` with `api.ts` (typed calls), hooks, components, and tests beside them. No `any` in new code.
- Gameplay feature (`apps/web/src/features/gameplay/`): `api.ts` (typed calls, `missionConfigFrom`, `isGraded`), `useActiveMission.ts`, `liveFeed.ts` (socket adapter), `useGameFeed.ts` (live vs replay via `NEXT_PUBLIC_GAMEPLAY_FEED=replay`), `useMissionGrading.ts` (polls process-game every 5 s with engine stats; the engine owns the spectacle, the backend owns rewards), `GameplayScreen.tsx`. The mission is locked for the session once loaded. Supported mission stats: points, blocks, steals; assists show a "not supported" state.
- TypeScript is pinned at `^5.9.0` at the root (see `apps/web/CLAUDE.md` for why).
- Deploy web: `dockerfile` at the root builds `apps/web` (Next standalone); `.github/workflows/deploy-develop.yml` and `captain-definition` use it.
- Deploy sandbox: the Vercel project `osb-ship-scenario` must have its Root Directory set to `apps/sandbox` (dashboard setting). Deploy from the repo root with `npx vercel deploy --prod --yes`; the CLI uploads the repo and Vercel builds the workspace. A CLI deploy from inside `apps/sandbox` cannot resolve the `@osb/gameplay` workspace sibling.
- `docs/superpowers/` (specs, plans) is gitignored on purpose.
