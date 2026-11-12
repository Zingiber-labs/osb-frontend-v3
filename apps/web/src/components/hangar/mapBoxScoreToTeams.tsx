import type { PlayerRow, Section } from "./BoxScoreCard";

export type BoxScoreTeam = {
  teamName: string;
  sections: Section[];
};

function formatPct(made?: number | null, att?: number | null): string {
  if (!att || att === 0) return "0";
  const pct = ((made ?? 0) / att) * 100;
  return pct.toFixed(1); // ej: "47.1"
}

function createEmptyStats(): NonNullable<PlayerRow["stats"]> {
  return {
    MIN: "00",
    PTS: 0,
    OREB: 0,
    DREB: 0,
    REB: 0,
    AST: 0,
    STL: 0,
    BLK: 0,
    TO: 0,
    FG: "0-0",
    "FG%": "0",
    "3PT": "0-0",
    "3PT%": "0",
    FT: "0-0",
    "FT%": "0",
    PF: 0,
    "+/-": 0,
  };
}

function mapPlayerToRow(stat: any): PlayerRow {
  const name =
    `${stat.player?.first_name ?? ""} ${stat.player?.last_name ?? ""}`.trim() ||
    "Unknown";

  const min = stat.min ?? "00";
  const hasPlayed =
    min !== "00" &&
    min !== "0" &&
    min !== "" &&
    min !== null &&
    min !== undefined;

  if (!hasPlayed) {
    return {
      name,
      dnpReason: "DNP - Coach's Decision",
    };
  }

  const oreb = stat.oreb ?? 0;
  const dreb = stat.dreb ?? 0;
  const reb = stat.reb ?? oreb + dreb;

  const stats: NonNullable<PlayerRow["stats"]> = {
    ...createEmptyStats(),
    MIN: min,
    PTS: stat.pts ?? 0,
    OREB: oreb,
    DREB: dreb,
    REB: reb,
    AST: stat.ast ?? 0,
    STL: stat.stl ?? 0,
    BLK: stat.blk ?? 0,
    TO: stat.turnovers ?? 0,
    FG: `${stat.fgm ?? 0}-${stat.fga ?? 0}`,
    "FG%": formatPct(stat.fgm, stat.fga),
    "3PT": `${stat.fg3m ?? 0}-${stat.fg3a ?? 0}`,
    "3PT%": formatPct(stat.fg3m, stat.fg3a),
    FT: `${stat.ftm ?? 0}-${stat.fta ?? 0}`,
    "FT%": formatPct(stat.ftm, stat.fta),
    PF: stat.fouls ?? 0,
    "+/-": stat.plus_minus ?? 0,
  };

  return {
    name,
    stats,
  };
}

function buildTeamTotals(players: PlayerRow[]): PlayerRow {
  const totals = createEmptyStats();

  const parsePair = (v: string | number | undefined): [number, number] => {
    if (v === undefined || v === null) return [0, 0];
    if (typeof v === "number") return [v, 0];
    const [m, a] = String(v)
      .split("-")
      .map((n) => Number(n) || 0);
    return [m, a];
  };

  players.forEach((p) => {
    const s = p.stats;
    if (!s) return;

    totals.PTS = (totals.PTS as number) + (Number(s.PTS ?? 0) || 0);
    totals.OREB = (totals.OREB as number) + (Number(s.OREB ?? 0) || 0);
    totals.DREB = (totals.DREB as number) + (Number(s.DREB ?? 0) || 0);
    totals.REB = (totals.REB as number) + (Number(s.REB ?? 0) || 0);
    totals.AST = (totals.AST as number) + (Number(s.AST ?? 0) || 0);
    totals.STL = (totals.STL as number) + (Number(s.STL ?? 0) || 0);
    totals.BLK = (totals.BLK as number) + (Number(s.BLK ?? 0) || 0);
    totals.TO = (totals.TO as number) + (Number(s.TO ?? 0) || 0);
    totals.PF = (totals.PF as number) + (Number(s.PF ?? 0) || 0);

    const [fgm, fga] = parsePair(s.FG);
    const [fg3m, fg3a] = parsePair(s["3PT"]);
    const [ftm, fta] = parsePair(s.FT);

    const [tFgm, tFga] = parsePair(totals.FG);
    const [tFg3m, tFg3a] = parsePair(totals["3PT"]);
    const [tFtm, tFta] = parsePair(totals.FT);

    totals.FG = `${tFgm + fgm}-${tFga + fga}`;
    totals["3PT"] = `${tFg3m + fg3m}-${tFg3a + fg3a}`;
    totals.FT = `${tFtm + ftm}-${tFta + fta}`;
  });

  const [fgm, fga] = String(totals.FG)
    .split("-")
    .map((n) => Number(n) || 0);
  const [fg3m, fg3a] = String(totals["3PT"])
    .split("-")
    .map((n) => Number(n) || 0);
  const [ftm, fta] = String(totals.FT)
    .split("-")
    .map((n) => Number(n) || 0);

  totals["FG%"] = formatPct(fgm, fga);
  totals["3PT%"] = formatPct(fg3m, fg3a);
  totals["FT%"] = formatPct(ftm, fta);

  return {
    name: "Team",
    stats: totals,
  };
}

function mapTeam(gameTeam: any): BoxScoreTeam {
  const allPlayers = (gameTeam?.players ?? []) as any[];

  const played: PlayerRow[] = [];
  const dnp: PlayerRow[] = [];

  allPlayers.forEach((p) => {
    const row = mapPlayerToRow(p);
    if (row.stats) {
      played.push(row);
    } else {
      dnp.push(row);
    }
  });

  const sections: Section[] = [];

  if (played.length > 0) {
    sections.push({
      label: "PLAYERS",
      players: played,
    });
  }

  if (dnp.length > 0) {
    sections.push({
      label: "Did Not Play",
      players: dnp,
    });
  }

  sections.push({
    label: "TEAM TOTALS",
    players: [buildTeamTotals(played)],
  });

  return {
    teamName: gameTeam?.full_name ?? gameTeam?.name ?? "Unknown team",
    sections,
  };
}

export function mapBoxScoreToTeams(game: any): BoxScoreTeam[] {
  if (!game) return [];

  const home = mapTeam(game.home_team);
  const visitor = mapTeam(game.visitor_team);

  return [home, visitor];
}
