import type { ShipAction } from "@/features/gameplay/engine/types";
import type { World } from "./world";

export function runAnimation(_world: World, _action: ShipAction): Promise<void> {
  return Promise.resolve();
}
