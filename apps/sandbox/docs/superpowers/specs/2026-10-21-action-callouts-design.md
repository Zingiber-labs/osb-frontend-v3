# Action Callouts — Design

Date: 2026-10-21
Status: approved in conversation
Builds on: the MVP spec and the sprites-and-squadron spec.

## 1. Goal

When the ship fires, takes a hit, raises its shield, stalls, or an enemy malfunctions, the player should see which basketball play caused it. A short floating label appears at the point of action for about 1.5 seconds, e.g. `MORANT +3` next to the exploding enemy, `SIAKAM +2` next to the laser that hits the ship, `JACKSON BLOCK` at the shield flash.

## 2. Data flow

- **Feed.** The replay adapter already knows the play's `playerIds` and the rosters. It adds a `label` string to every `score`, `block`, `steal`, and `turnover` event. Format: the player's last name in upper case, or the team abbreviation when the play has no player (team turnover), followed by the play: `+1`, `+2`, `+3`, `BLOCK`, `STEAL`, `TURNOVER`.
- **Engine.** `GameEvent` variants `score`, `block`, `steal`, `turnover` gain `label?: string`. `ShipAction` variants `fire`, `hit`, `shieldUp`, `fizzle`, `stall`, `enemyMalfunction` gain `caption?: string` and a `side: "mine" | "theirs"` is already implied by the type; the reducer copies `event.label` into `action.caption` and, for `fire`, keeps `charged` to color the caption. The engine stays pure and does no formatting. Events without a label (tests, future adapters) produce actions without a caption.
- **Renderer.** A `callout` helper creates a Pixi `Text`, places it at the action's position, floats it up ~24 px while fading over 1500 ms, and destroys it. Callouts run concurrently with the action animation and are not awaited, so the action queue's timing is unchanged. Colors: cyan for my team, gold when it is my chosen player (charged fire), red for the opponent. Text style: bold, 16 px, white stroke for legibility on any background.

| Action | Callout position |
|---|---|
| `fire` | at the target enemy when the shot lands |
| `hit` | just right of the ship when the laser lands |
| `shieldUp` | above the ship |
| `fizzle` | where the shot fizzles |
| `stall` | above the ship |
| `enemyMalfunction` | at the malfunctioning enemy |

`objectiveComplete`, `warpOut`, and `explode` get no callout; the HUD and result overlay already explain them.

## 3. Testing

- Replay feed: labels for a score by a named player (`ONE +2` for "Home One"), a team turnover with no player (`HOM TURNOVER`), a block (`TWO BLOCK`).
- Engine: a `score` event with a label yields a `fire` action with the same caption; an event without a label yields no `caption` key set to a string.
- Renderer: manual check through the debug panel, which gets sample captions on its fire/hit/shieldUp buttons.

## 4. Out of scope

A scrolling play-by-play log, sound, and any change to mapping rules or durations.
