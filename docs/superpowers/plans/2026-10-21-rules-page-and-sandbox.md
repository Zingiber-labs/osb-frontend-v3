# Rules page and sandbox screen — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Spanish rules page at `/reglas`, feed-less sandbox at `/sandbox` holding the renderer test buttons, and a game screen without any test controls.

**Architecture:** Two new feature folders (`features/rules`, `features/sandbox`) with a page each; the sandbox reuses `ScenarioCanvas` and talks to the renderer only through `RendererPort`. `DebugPanel` is deleted. Rules numbers come from `engine/mapping.ts`.

**Tech stack:** React 19, React Router 7, Vitest + RTL, Tailwind 4.

Spec: `docs/superpowers/specs/2026-10-21-rules-page-and-sandbox-design.md`.

## Global constraints

- Rules page text is Spanish; every other screen stays English.
- No `import.meta.env.DEV` gating remains in `GamePlayPage`.
- Sandbox never imports pixi.js directly; it goes through `ScenarioCanvas` and `RendererPort`.
- Hull/shield values the sandbox sends are clamped to `HULL_MIN..HULL_MAX` and `0..SHIELD_MAX`.

---

### Task 1: Rules page

**Files:** create `src/features/rules/RulesPage.tsx`, `src/features/rules/RulesPage.test.tsx`; modify `src/app/router.tsx`, `src/app/Layout.tsx`.

- [ ] Test: renders heading "Reglas del escenario" and the text `${HULL_DAMAGE_BY_POINTS[3]}` next to "3 puntos"; nav shows a "Reglas" link.
- [ ] Implement page: sections per spec, table rows built from `ENEMY_BY_POINTS` and `HULL_DAMAGE_BY_POINTS`.
- [ ] Add route `reglas` and nav link.
- [ ] `npm test -- rules` passes.

### Task 2: Sandbox page and controls

**Files:** create `src/features/sandbox/SandboxPage.tsx`, `src/features/sandbox/SandboxControls.tsx`, `src/features/sandbox/sampleActions.ts`, `src/features/sandbox/SandboxPage.test.tsx`; modify `router.tsx`, `Layout.tsx`.

**Interfaces:** `SAMPLE_ACTIONS: { label: string; action: ShipAction }[]` (moved from DebugPanel). `SandboxControls({ renderer })` builds state with `createInitialState({ stat: "pts", target: 1 })`, overrides `hull`, `shield`, `status: "live"`, calls `renderer.syncState`.

- [ ] Test (renderer mocked as in `GamePlayPage.test.tsx`): clicking "fire cruiser charged" calls `enqueue` with that action; changing hull to 20 calls `syncState` with `hull: 20`.
- [ ] Implement page + controls; route `sandbox`; nav link.
- [ ] `npm test -- sandbox` passes.

### Task 3: Clean the game screen

**Files:** delete `src/features/gameplay/components/DebugPanel.tsx`; modify `GamePlayPage.tsx`, `GamePlayPage.test.tsx`, `README.md`, `CLAUDE.md`.

- [ ] Test: after Start, `queryByRole("button", { name: /fire scout/i })` is null.
- [ ] Remove the panel import and render; delete the file.
- [ ] Docs: routes list, sandbox replaces debug panel.
- [ ] Full `npm test`, `npx tsc -b --noEmit`, `npm run lint` clean; browser check of `/reglas` and `/sandbox`.
