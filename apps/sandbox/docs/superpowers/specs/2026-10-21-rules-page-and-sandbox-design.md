# Rules page and sandbox screen

Date: 2026-10-21. Branch: `feat/ship-scenario-mvp`.

## Goal

Give coworkers a Spanish explanation of the scenario logic, move the renderer test buttons off the real game screen into a screen of their own, and leave the game screen free of anything that exists only for testing.

## Rules page (`/reglas`)

- New feature folder `src/features/rules/` with `RulesPage.tsx`, linked from the header nav as "Reglas".
- Content is Spanish prose plus tables. It covers, in this order:
  1. Qué representa la nave y qué equipo es "mi equipo" (el del jugador elegido).
  2. Tabla de jugadas → acciones de la nave: canasta de mi equipo destruye un enemigo según los puntos (1 = scout, 2 = fighter, 3 = cruiser); disparo cargado si anota mi jugador; canasta rival quita casco 2/4/6 salvo que un escudo la absorba; tapón o robo de mi equipo suma una carga de escudo (máximo 3); pérdida de mi equipo = la nave se traba, pérdida rival = un enemigo falla.
  3. La misión: solo cuentan las estadísticas del jugador elegido (puntos, tapones o robos); se cumple en cuanto el contador llega al objetivo y no se pierde después; al final del partido, misión cumplida = salto al hiperespacio (victoria), no cumplida = explosión (derrota). Los puntos de los compañeros, el combo y los enemigos destruidos no afectan la misión.
  4. Glosario del HUD (HULL, SHIELD, COMBO, marcador, reloj, MISSION, KILLS) y de los rótulos flotantes.
- Numbers (hull damage per basket, shield max, hull max, enemy by points) are read from `engine/mapping.ts`, never typed by hand.
- The rest of the app stays in English.

## Sandbox screen (`/sandbox`)

- New folder `src/features/sandbox/` with `SandboxPage.tsx` and `SandboxControls.tsx`, linked from the header nav as "Sandbox". Available in every build, not only in dev.
- Mounts `ScenarioCanvas` exactly like the game screen, with no feed, no game data and no HUD.
- Controls, rendered below the canvas (not overlaid):
  - One button per ship action with the same sample captions the debug panel used today: fire scout / fighter / cruiser charged, hit 3, hit absorbed, shieldUp, fizzle, stall, enemyMalfunction, objectiveComplete, warpOut, explode. Each click calls `renderer.enqueue([action])`.
  - Hull (number input 1..100) and shield (0..3) inputs. On change the page calls `renderer.syncState(state)` with a `ScenarioState` built from `createInitialState` plus those values and `status: "live"`, so damage states, the low-hull vignette and the shield glow can be checked on their own.
- No Pause / Resume / Step: there is no feed to drive.

## Game screen cleanup

- `DebugPanel.tsx` is deleted; `GamePlayPage` no longer renders anything gated on `import.meta.env.DEV`.
- The HUD stays unchanged.

## Tests

- `RulesPage.test.tsx`: renders the Spanish heading and the hull damage figures taken from `mapping.ts`.
- `SandboxPage.test.tsx`: with the renderer mocked (same pattern as `GamePlayPage.test.tsx`), clicking "fire cruiser charged" enqueues that action; changing hull syncs a state with that hull.
- `GamePlayPage.test.tsx`: after start, no button named "fire scout" exists.

## Docs

CLAUDE.md and README mention the two routes and that renderer checks happen in the sandbox screen instead of a dev-only panel.
