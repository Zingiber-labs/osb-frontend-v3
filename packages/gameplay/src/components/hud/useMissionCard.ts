import { useEffect, useRef, useState } from "react";
import type { ScenarioState } from "../../engine/types";
import { cardFor, type CardContext, type MissionCardData } from "./missionCardRules";

/** Turns state transitions into a timed card. A newer card replaces the current one and restarts its timer. */
export function useMissionCard(state: ScenarioState, ctx: CardContext): MissionCardData | null {
  const [card, setCard] = useState<MissionCardData | null>(null);
  const prev = useRef(state);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const next = cardFor(prev.current, state, ctx);
    prev.current = state;
    if (!next) return;
    setCard(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCard(null), next.ms);
    // ctx may be a fresh object each render; cardFor(prev, prev) is null, so a re-run without a state change is harmless.
  }, [state, ctx]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return card;
}
