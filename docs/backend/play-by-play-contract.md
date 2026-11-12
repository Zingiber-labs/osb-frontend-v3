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
`players` lists everyone who may appear in `playerIds` (active rosters are enough).

`gamePlay` (one per play)
```json
{ "order": 42, "period": 1, "clockSeconds": 611, "homeScore": 12, "awayScore": 9,
  "kind": "score", "points": 3, "teamId": "2", "playerIds": ["1091465698"] }
```
- `order`: strictly increasing within a game; the client dedupes by it.
- `period`: 1-4, 5+ overtime. `clockSeconds`: seconds left in the period.
- `kind`: `score | block | steal | turnover | period | final | other`. `points` (1, 2, 3) only for `score`.
- `period` plays mark the start of a period; `final` is the last play and carries the final score.
- `other` plays are ignored by the client but keep the clock honest; sending them is optional.

## Not changed
`POST /missions/process-game` keeps grading missions; the client still calls it every 5 s with the player's stats and stops when the response reports done.
