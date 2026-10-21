import { useEffect, useRef, useState } from "react";
import { createInitialState, reduce } from "@/features/gameplay/engine/reduce";
import type { MissionConfig, ScenarioState } from "@/features/gameplay/engine/types";
import type { Feed } from "@/features/gameplay/feeds/types";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";

/**
 * The only bridge between feed, engine and renderer.
 * Folds every feed event through `reduce`, pushes actions and state to the renderer,
 * and exposes the current state to React.
 */
export function useScenario(feed: Feed | null, mission: MissionConfig, renderer: RendererPort | null): ScenarioState {
  const [state, setState] = useState<ScenarioState>(() => createInitialState(mission));
  const stateRef = useRef(state);
  const rendererRef = useRef(renderer);

  useEffect(() => {
    rendererRef.current = renderer;
  }, [renderer]);

  useEffect(() => {
    const initial = createInitialState(mission);
    stateRef.current = initial;
    setState(initial);
    if (!feed) return;
    return feed.onEvent((event) => {
      const { state: next, actions } = reduce(stateRef.current, event);
      stateRef.current = next;
      if (actions.length > 0) rendererRef.current?.enqueue(actions);
      rendererRef.current?.syncState(next);
      setState(next);
    });
    // mission is compared by value so a new object with the same config does not reset the run
  }, [feed, mission.stat, mission.target]);

  return state;
}
