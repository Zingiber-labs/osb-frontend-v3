import { mkdir, writeFile } from "node:fs/promises";
import { espnToRecordedGame, type EspnSummary } from "./espnToRecordedGame";

const eventId = process.argv[2];
if (!eventId) {
  console.error("usage: npm run record-game -- <espnEventId>");
  process.exit(1);
}

const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`;
const res = await fetch(url);
if (!res.ok) {
  console.error(`ESPN responded ${res.status} for ${url}`);
  process.exit(1);
}
const summary = (await res.json()) as EspnSummary;
if (!summary.plays?.length) {
  console.error("summary has no plays; pick a completed game id from the ESPN scoreboard");
  process.exit(1);
}

const game = espnToRecordedGame(summary);
await mkdir("../../packages/gameplay/src/fixtures/games", { recursive: true });
const out = `../../packages/gameplay/src/fixtures/games/${game.id}.json`;
await writeFile(out, JSON.stringify(game, null, 2));
console.log(`wrote ${out}: ${game.plays.length} plays, ${game.home.abbreviation} vs ${game.away.abbreviation}`);
