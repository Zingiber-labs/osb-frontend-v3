import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MissionStat } from "@/features/gameplay/engine/types";
import type { RecordedGame } from "@/features/gameplay/feeds/types";
import type { StartConfig } from "./types";

type Props = {
  games: RecordedGame[];
  initialGameId?: string;
  initialPlayerId?: string;
  error?: string | null;
  onStart: (config: StartConfig) => void;
};

const selectClass = "rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100";

export function SetupPanel({ games, initialGameId, initialPlayerId, error, onStart }: Props) {
  const firstGame = games.find((g) => g.id === initialGameId) ?? games[0];
  const [gameId, setGameId] = useState(firstGame?.id ?? "");
  const game = games.find((g) => g.id === gameId) ?? firstGame;
  const roster = game ? [...game.home.players.map((p) => ({ ...p, team: game.home.abbreviation })), ...game.away.players.map((p) => ({ ...p, team: game.away.abbreviation }))] : [];
  const [playerId, setPlayerId] = useState(roster.some((p) => p.id === initialPlayerId) ? initialPlayerId! : roster[0]?.id ?? "");
  const [stat, setStat] = useState<MissionStat>("pts");
  const [target, setTarget] = useState(20);
  const [speed, setSpeed] = useState(16);

  if (!game) {
    return <p className="text-rose-400">No recorded games are available. Run `npm run record-game -- &lt;espnEventId&gt;` first.</p>;
  }

  return (
    <form
      className="flex max-w-md flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!playerId) return;
        onStart({ gameId: game.id, playerId, mission: { stat, target }, speed });
      }}
    >
      {error ? <p className="text-rose-400">{error}</p> : null}
      <label className="flex flex-col gap-1 text-sm">
        Game
        <select className={selectClass} value={game.id} onChange={(e) => { setGameId(e.target.value); setPlayerId(""); }}>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.home.abbreviation} vs {g.away.abbreviation} ({g.date.slice(0, 10)})</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Player
        <select className={selectClass} value={playerId || roster[0]?.id} onChange={(e) => setPlayerId(e.target.value)}>
          {roster.map((p) => (
            <option key={p.id} value={p.id}>{p.team} · {p.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Mission stat
        <select className={selectClass} value={stat} onChange={(e) => setStat(e.target.value as MissionStat)}>
          <option value="pts">Points</option>
          <option value="blk">Blocks</option>
          <option value="stl">Steals</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Target
        <input className={selectClass} type="number" min={1} value={target} onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 1))} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Speed
        <input className={selectClass} type="number" min={1} value={speed} onChange={(e) => setSpeed(Math.max(1, Number(e.target.value) || 1))} />
      </label>
      <Button type="submit">Start</Button>
    </form>
  );
}
