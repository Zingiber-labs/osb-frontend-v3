# Play-by-play socket contract (gameplay screen)

The web client's gameplay screen consumes one game's plays over the existing socket.io server.
All ids are the backend's numeric game and player ids, sent as strings where the type says so.

## Client → server

`subscribeToGamePlays` `{ gameId: number, fromOrder: number }`
- Server replies with one `gameInfo`, then every play with `order > fromOrder` in order, then live plays as they happen.
- Sent again after a reconnect with the last `order` the client applied.

`unsubscribeFromGamePlays` `{ gameId: number }`

## Server → client

`gameInfo` (once per subscribe)
```json
{ "id": "21718083", "date": "2026-11-12T00:00:00Z",
  "home": { "id": "2", "name": "Boston Celtics", "abbreviation": "BOS", "players": [{ "id": "1091465698", "name": "Dillon Mitchell" }] },
  "away": { "id": "14", "name": "Los Angeles Lakers", "abbreviation": "LAL", "players": [] } }
```
`players` lists everyone who may appear in `playerIds` (active rosters are enough), and MUST include every player id the client can subscribe with (any player the hangar lets the user pick for this game). A missing id makes the client show "This player is not part of this game."

`gameError` (instead of `gameInfo`)
```json
{ "gameId": 21718083, "message": "Unknown game 21718083" }
```
- Sent instead of `gameInfo` when the game is unknown or the subscribed player is not on either roster.
- `message` is shown to the user as is, so keep it short and human-readable.
- If neither `gameInfo` nor `gameError` arrives within 15 s of subscribing, the client gives up and shows "We could not reach the live game feed."

`gamePlay` (one per play)
```json
{ "order": 42, "period": 1, "clockSeconds": 611, "homeScore": 12, "awayScore": 9,
  "kind": "score", "points": 3, "teamId": "2", "playerIds": ["1091465698"] }
```
- `order`: integer starting at 1, strictly increasing within a game; the client dedupes by it and resumes with `fromOrder` = the last order it applied (0 means from the beginning).
- `period`: 1-4, 5+ overtime. `clockSeconds`: seconds left in the period.
- `kind`: `score | block | steal | turnover | period | final | other`. `points` (1, 2, 3) only for `score`.
- `period` plays mark the start of a period; `final` is the last play and carries the final score.
- `other` plays are ignored by the client but keep the clock honest; sending them is optional.

## Grading (`POST /missions/process-game`)
- Live mode only, and only after `gameInfo` arrives; replay mode never posts.
- The client polls every 5 s with the stats its engine has counted from the plays (points, blocks, steals; rebounds and assists are sent as 0), with `isGameFinished: false`.
- At the buzzer (the `final` play) it posts once more with `isGameFinished: true` and the final stats.
- It stops polling when a response is a verdict: `missionsCompleted: true` with `processedMissions > 0` (or `done: true` / `status: "completed"`), or, for the post sent with `isGameFinished: true`, any `missionsCompleted` value.
- The final post may arrive after the mission was already completed by an earlier poll; it must be idempotent (no double rewards, no error that undoes the earlier result).
