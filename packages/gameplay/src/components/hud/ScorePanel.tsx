import type { Clock, MyPlayerStats } from "../../engine/types";
import type { GameHeader } from "../../feeds/mapPlay";
import { useFlashOnChange } from "./useFlashOnChange";

type Props = { clock: Clock; game: GameHeader; myTeamId: string; stats: MyPlayerStats };

export function ScorePanel({ clock, game, myTeamId, stats }: Props) {
  const flash = useFlashOnChange(`${clock.home}-${clock.away}`);
  const team = (id: string) => (id === myTeamId ? "text-hud-mine" : "text-slate-400");
  return (
    <div data-hud-panel="score" className="flex flex-col items-end gap-1 border-r border-t border-hud-chrome/70 pr-3 pt-2 text-right">
      <span className="font-display text-[10px] tracking-[0.3em] text-hud-chrome">SCORE</span>
      <div
        data-testid="score"
        className={`font-display text-2xl tabular-nums tracking-wider text-slate-100 motion-safe:transition-[text-shadow] motion-safe:duration-300 ${flash ? "[text-shadow:0_0_12px_#38bdf8]" : ""}`}
      >
        <span className={team(game.home.id)}>{game.home.abbreviation}</span> {clock.home} - {clock.away} <span className={team(game.away.id)}>{game.away.abbreviation}</span>
      </div>
      <div className="hidden text-xs tabular-nums tracking-widest text-slate-300 md:block">
        PTS {stats.pts} · BLK {stats.blk} · STL {stats.stl} · TOV {stats.tov}
      </div>
    </div>
  );
}
