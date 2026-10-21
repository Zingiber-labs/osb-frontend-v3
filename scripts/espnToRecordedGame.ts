import type { Points } from "../src/features/gameplay/engine/types";
import type { PlayKind, RecordedGame, RecordedPlay, RosterPlayer, TeamRoster } from "../src/features/gameplay/feeds/types";

export type EspnCompetitor = {
  homeAway: "home" | "away";
  team: { id: string; displayName: string; abbreviation: string };
};

export type EspnPlay = {
  id: string;
  sequenceNumber: string;
  type: { text: string };
  text: string;
  homeScore: number;
  awayScore: number;
  period: { number: number };
  clock: { displayValue: string };
  scoringPlay: boolean;
  shootingPlay?: boolean;
  scoreValue?: number;
  team?: { id: string };
  participants?: { athlete: { id: string } }[];
};

export type EspnSummary = {
  header: { id: string; competitions: { date: string; competitors: EspnCompetitor[] }[] };
  boxscore: { players: { team: { id: string }; statistics: { athletes: { athlete: { id: string; displayName: string } }[] }[] }[] };
  plays: EspnPlay[];
};

export function parseClock(display: string): number {
  if (display.includes(":")) {
    const [m, s] = display.split(":").map(Number);
    return Math.round(m * 60 + s);
  }
  return Math.round(Number(display));
}

function rosterFor(summary: EspnSummary, teamId: string): RosterPlayer[] {
  const entry = summary.boxscore.players.find((p) => p.team.id === teamId);
  const byId = new Map<string, RosterPlayer>();
  for (const stat of entry?.statistics ?? []) {
    for (const a of stat.athletes) byId.set(a.athlete.id, { id: a.athlete.id, name: a.athlete.displayName });
  }
  return [...byId.values()];
}

function periodLength(period: number): number {
  return period >= 5 ? 300 : 720;
}

export function espnToRecordedGame(summary: EspnSummary): RecordedGame {
  const comp = summary.header.competitions[0];
  const home = comp.competitors.find((c) => c.homeAway === "home");
  const away = comp.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) throw new Error("summary is missing a home or away competitor");

  const toRoster = (c: EspnCompetitor): TeamRoster => ({
    id: c.team.id,
    name: c.team.displayName,
    abbreviation: c.team.abbreviation,
    players: rosterFor(summary, c.team.id),
  });
  const otherTeam = (teamId: string | undefined) => (teamId === home.team.id ? away.team.id : home.team.id);

  const plays: RecordedPlay[] = [];
  let order = 0;
  const push = (p: EspnPlay, kind: PlayKind, extra: Partial<RecordedPlay> = {}) => {
    plays.push({
      order: order++,
      period: p.period.number,
      clockSeconds: parseClock(p.clock.displayValue),
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      kind,
      teamId: p.team?.id,
      playerIds: (p.participants ?? []).map((x) => x.athlete.id),
      ...extra,
    });
  };

  for (const p of summary.plays) {
    const typeText = p.type.text.toLowerCase();
    const text = p.text.toLowerCase();
    const participants = (p.participants ?? []).map((x) => x.athlete.id);

    if (typeText === "end game") {
      push(p, "final", { playerIds: [], teamId: undefined });
      continue;
    }
    if (typeText === "end period") {
      const nextPeriod = p.period.number + 1;
      push(p, "period", { period: nextPeriod, clockSeconds: periodLength(nextPeriod), playerIds: [], teamId: undefined });
      continue;
    }
    if (p.scoringPlay && p.scoreValue && p.scoreValue >= 1 && p.scoreValue <= 3) {
      push(p, "score", { points: p.scoreValue as Points, playerIds: participants.slice(0, 1) });
      continue;
    }
    if (typeText.includes("turnover")) {
      push(p, "turnover", { playerIds: participants.slice(0, 1) });
      if (text.includes("steals")) {
        push(p, "steal", { teamId: otherTeam(p.team?.id), playerIds: participants.slice(1, 2) });
      }
      continue;
    }
    if (p.shootingPlay && !p.scoringPlay && text.includes("blocks")) {
      push(p, "block", { teamId: otherTeam(p.team?.id), playerIds: participants.slice(1, 2) });
      continue;
    }
    push(p, "other");
  }

  return { id: summary.header.id, date: comp.date, home: toRoster(home), away: toRoster(away), plays };
}
