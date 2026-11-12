# Cinematic HUD

Date: 2026-11-03. Status: approved in conversation, awaiting Oscar's review of this file.

## Goal

Replace the plain top strip on the game screen with a cinematic heads-up display in the style of
the helion-rift.vercel.app reference: corner panels with slashed bars, a mission title card, a
play-by-play ticker and a matching result screen, over a full-bleed scene. React + Tailwind only;
the engine, feeds, renderer and the `useScenario` bridge do not change.

Out of scope: portrait phones, sound, changes to the Pixi scene or its callouts, the sandbox and
rules pages (they keep the nav and their current look).

## Layout and visual language

- **Full-bleed frame.** While a game is running the game renders in a fixed full-viewport layer that
  covers the site header, so the scene fills the viewport without changing `Layout.tsx`. The HUD is a fixed overlay with four corner zones, a top-center lane (mission card) and
  a bottom-center lane (ticker). `pointer-events: none` everywhere except the Exit button. Safe
  margins 24 px at 768 px and wider, 12 px below.
- **Typeface.** `@fontsource-variable/orbitron` for labels, headings and large numbers, exposed as
  `--font-display`; Geist stays for body text (ticker chips, setup panel). Labels uppercase with wide
  tracking; numbers use `font-variant-numeric: tabular-nums`.
- **Palette.** Cyan = mine (hull, my team, my plays), gold = charged / mission events, rose = theirs
  and danger, slate-blue = neutral chrome. Same hex values as `CALLOUT_COLORS` in the renderer
  (`0x38bdf8`, `0xfbbf24`, `0xf43f5e`) so HUD and scene agree.
- **Chrome.** No boxes. Each corner panel has a 1 px bracket on its outer corner and a thin rule;
  text sits on a subtle dark gradient for legibility over bright rocks.
- **Bars.** `SegmentBar`: a row of slanted segments. Hull = 20 segments of 5 hull points; shield =
  3 larger segments. Segments fill from the left; lost segments stay as dim outlines. Hull turns rose
  below 25 % (the vignette threshold).

### Corners

| Zone | Content |
| --- | --- |
| Top-left | Period label (`Q1`..`Q4`, `OT1`..) and clock `mm:ss`, a small pulsing "LIVE" dot, and the Exit bracket under them |
| Top-right | NBA score `MEM 48 - 52 IND` with my team in cyan (text kept as today for the page test); under it my player's line `PTS 12 · BLK 1 · STL 2 · TOV 3` |
| Bottom-left | HULL segment bar with the number, SHIELD segment bar |
| Bottom-right | KILLS counter and COMBO counter |
| Top-center | Mission card lane |
| Bottom-center | Play ticker |

## Mission card

- Shown at tip-off for 4 s: eyebrow "MISSION", headline `20 PTS · JA MORANT`, subline `MEM vs IND`.
- Shown for 3 s on: mission met ("OBJECTIVE COMPLETE", gold, with the final count), a period change
  (`Q3` plus current progress `14 / 20 PTS`), and Final ("FINAL", just before the result screen).
- Fades and slides in 8 px; `aria-live="polite"`; never intercepts pointer events.
- Timing lives in `useMissionCard(state)`: pure logic over state changes (status, `mission.met`,
  `clock.period`), returning `{ card, visible }`; durations are constants; uses one timeout.

## Play ticker

- One line at bottom-center with the last four labeled plays as chips, newest on the right, the
  oldest at reduced opacity. Chip colors follow the callout palette: my plays cyan, my player's
  charged plays gold, theirs rose.
- Source: `usePlayLog(feed, myTeamId)` subscribes to `feed.onEvent` (the feed supports several
  subscribers), keeps events that carry a `label`, caps at 4, resets when `feed` changes. Tip-off,
  period and final events are not listed.

## Result screen

`ResultOverlay` restyled in the same language: dimmed scene, wide Orbitron title ("MISSION
SUCCESS" cyan / "MISSION FAILED" rose), the mission line with final progress (`18 / 20 PTS`), a
four-stat row (KILLS, HULL, PTS, BLK+STL), and two buttons: Replay (same game and player) and
Back to setup. It still waits for the renderer to go idle (warp or explosion) as today.

## Exit

A small "EXIT" bracket under the clock, the only interactive HUD element: stops the feed and returns
to the setup panel with the header visible. No confirmation.

## Behavior and motion

- Panels fade in over 400 ms when a game starts.
- Score digits and the kills counter glow cyan for 300 ms on change; combo scales up briefly when it
  grows and dims when it resets to 0; a lost hull segment transitions to its dim outline; a shield segment that
  absorbs a hit flashes white. CSS transitions and tw-animate-css utilities only.
- `prefers-reduced-motion`: transitions instant, the card appears and disappears without motion.
- Responsive: at or above `lg` (1024 px) everything shows; `md` to `lg` hides the ticker but keeps the
  stat line and sublines; below `md` the stat line and sublines are hidden too and segments are narrower.
  Portrait is out of scope.
- HUD-only fallback (scene failed to start) keeps working over the dark background.

## Code structure

New folder `src/features/gameplay/components/hud/`:

| File | Responsibility |
| --- | --- |
| `HudOverlay.tsx` | Places the pieces; replaces `Hud.tsx` |
| `ClockPanel.tsx` | Period, clock, LIVE dot, hosts `ExitButton` |
| `ScorePanel.tsx` | NBA score and my player's line |
| `StatusPanel.tsx` | Hull and shield `SegmentBar`s |
| `CountersPanel.tsx` | Kills and combo |
| `SegmentBar.tsx` | Shared slashed bar (`value`, `max`, `segments`, `low`) |
| `MissionCard.tsx` | Card presentation |
| `PlayTicker.tsx` | Chips presentation |
| `ExitButton.tsx` | The one interactive element |
| `usePlayLog.ts` | Last-four labeled events from the feed |
| `useMissionCard.ts` | Which card to show and for how long |

Modified: `GamePlayPage.tsx` (full-bleed while running, exit wiring, feed to the ticker hook),
`ResultOverlay.tsx` (restyle, "Back to setup"), `index.css` (Orbitron import, `--font-display`),
`package.json` (`@fontsource-variable/orbitron`). `Hud.tsx` is deleted.

Untouched: engine, feeds, renderer, `useScenario`, `Layout.tsx`, sandbox, rules page.

## Testing

Vitest + React Testing Library:
- `SegmentBar`: fills the right number of segments for value/max/segments, flags `low`.
- `StatusPanel`, `ScorePanel`, `CountersPanel`, `ClockPanel`: render state values, "mine" coloring,
  `OT` labels, progressbar roles and the `score` test id kept.
- `usePlayLog`: keeps the last four labeled events, ignores unlabeled ones, resets on feed change.
- `useMissionCard`: tip-off, objective met, period change and final cards; hides after the duration
  (fake timers); no card on unrelated state changes.
- `GamePlayPage`: header hidden while running, Exit returns to setup; `ResultOverlay`: both outcomes
  and both buttons.
- Existing 118 tests keep passing. Browser check at 1920, 1280 and 800 px wide with screenshots.

## Risks

- Orbitron's wide glyphs can overflow at 768 px: the responsive rules above drop secondary lines
  first; verify in the 800 px screenshot.
- Hiding the header changes the scene host height, which the cover-fit already handles.
