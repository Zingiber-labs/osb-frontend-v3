import type { ScenarioState, ShipAction } from "@/features/gameplay/engine/types";

export interface RendererPort {
  enqueue(actions: ShipAction[]): void;
  syncState(state: ScenarioState): void;
  whenIdle(): Promise<void>;
}

export const NULL_RENDERER: RendererPort = {
  enqueue() {},
  syncState() {},
  whenIdle: () => Promise.resolve(),
};
