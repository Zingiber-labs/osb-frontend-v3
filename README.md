# OSB monorepo

Outer Sports Ballers: the Next.js player app, the PixiJS ship-scenario gameplay package, and a Vite tuning sandbox. npm workspaces, Node 22.

| Workspace | Path | What |
|---|---|---|
| `@osb/web` | `apps/web` | Product: Next.js 15 player app (auth, missions, hangar, store, gameplay route). See `apps/web/README.md`. |
| `@osb/gameplay` | `packages/gameplay` | Framework-free ship-scenario gameplay: engine, feeds, PixiJS renderer, HUD. Consumed as source. |
| `@osb/sandbox` | `apps/sandbox` | Vite dev app: `/sandbox` (renderer tuning) and `/reglas` (Spanish rules). |

```bash
npm ci
npm run dev:web        # :3000
npm run dev:sandbox    # :5173
npm test               # vitest in every workspace
npm run typecheck
npm run lint           # oxlint, root config .oxlintrc.json
npm run build:web
```

Backend socket contract for live gameplay: `docs/backend/play-by-play-contract.md`.
