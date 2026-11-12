import type { Clock, GameEvent, Side } from "../engine/types";
import type { RecordedGame, RecordedPlay } from "./types";

/** A recorded game without its plays: what a live source sends once, before the plays. */
export type GameHeader = Omit<RecordedGame, "plays">;

export function findTeamId(game: GameHeader, playerId: string): string {
  if (game.home.players.some((p) => p.id === playerId)) return game.home.id;
  if (game.away.players.some((p) => p.id === playerId)) return game.away.id;
  throw new Error(`Player ${playerId} is not on either roster of game ${game.id}`);
}

export function clockOf(play: RecordedPlay): Clock {
  return { period: play.period, secondsLeft: play.clockSeconds, home: play.homeScore, away: play.awayScore };
}

const SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv"]);

export function formatLabel(name: string | undefined, teamAbbr: string, what: string): string {
  if (!name) return `${teamAbbr} ${what}`;
  const parts = name.trim().split(/\s+/);
  let last = parts[parts.length - 1] ?? "";
  if (SUFFIXES.has(last.toLowerCase()) && parts.length > 1) last = parts[parts.length - 2];
  return `${last.toUpperCase()} ${what}`;
}

type Lookup = { names: Map<string, string>; abbr: Map<string, string> };

function buildLookup(game: GameHeader): Lookup {
  const names = new Map<string, string>();
  const abbr = new Map<string, string>();
  for (const team of [game.home, game.away]) {
    abbr.set(team.id, team.abbreviation);
    for (const p of team.players) names.set(p.id, p.name);
  }
  return { names, abbr };
}

function labelFor(play: RecordedPlay, lookup: Lookup): string | undefined {
  const what =
    play.kind === "score" ? (play.points ? `+${play.points}` : undefined)
    : play.kind === "block" ? "BLOCK"
    : play.kind === "steal" ? "STEAL"
    : play.kind === "turnover" ? "TURNOVER"
    : undefined;
  if (!what) return undefined;
  const name = play.playerIds.map((id) => lookup.names.get(id)).find((n): n is string => Boolean(n));
  const teamAbbr = (play.teamId && lookup.abbr.get(play.teamId)) || "TEAM";
  return formatLabel(name, teamAbbr, what);
}

export type PlayMapper = { myTeamId: string; toEvent(play: RecordedPlay): GameEvent | null };

/** Turns recorded plays into engine events from one player's point of view. Pure; shared by every feed. */
export function createPlayMapper(game: GameHeader, myPlayerId: string): PlayMapper {
  const myTeamId = findTeamId(game, myPlayerId);
  const lookup = buildLookup(game);
  return {
    myTeamId,
    toEvent(play) {
      const at = clockOf(play);
      const side: Side = play.teamId === myTeamId ? "mine" : "theirs";
      const byMyPlayer = play.playerIds.includes(myPlayerId);
      switch (play.kind) {
        case "score":
          return play.points ? { kind: "score", side, points: play.points, byMyPlayer, label: labelFor(play, lookup), at } : null;
        case "block":
        case "steal":
        case "turnover":
          return { kind: play.kind, side, byMyPlayer, label: labelFor(play, lookup), at };
        case "period":
          return { kind: "period", period: play.period, at };
        case "final":
          return { kind: "final", at };
        default:
          return null;
      }
    },
  };
}
