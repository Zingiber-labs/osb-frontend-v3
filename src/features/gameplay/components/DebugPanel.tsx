import { Button } from "@/components/ui/button";
import type { ShipAction } from "@/features/gameplay/engine/types";
import type { Feed } from "@/features/gameplay/feeds/types";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";

type Props = { feed: Feed | null; renderer: RendererPort | null };

const SAMPLES: { label: string; action: ShipAction }[] = [
  { label: "fire scout", action: { type: "fire", size: "scout", charged: false } },
  { label: "fire fighter", action: { type: "fire", size: "fighter", charged: false } },
  { label: "fire cruiser charged", action: { type: "fire", size: "cruiser", charged: true } },
  { label: "hit 3", action: { type: "hit", points: 3, absorbed: false } },
  { label: "hit absorbed", action: { type: "hit", points: 2, absorbed: true } },
  { label: "shieldUp", action: { type: "shieldUp" } },
  { label: "fizzle", action: { type: "fizzle" } },
  { label: "stall", action: { type: "stall" } },
  { label: "enemyMalfunction", action: { type: "enemyMalfunction" } },
  { label: "objectiveComplete", action: { type: "objectiveComplete" } },
  { label: "warpOut", action: { type: "warpOut" } },
  { label: "explode", action: { type: "explode" } },
];

export function DebugPanel({ feed, renderer }: Props) {
  return (
    <div className="absolute bottom-0 left-0 z-10 flex max-w-full flex-wrap gap-1 bg-slate-950/70 p-2 text-xs">
      <Button size="sm" variant="secondary" onClick={() => feed?.pause()}>Pause</Button>
      <Button size="sm" variant="secondary" onClick={() => feed?.start()}>Resume</Button>
      <Button size="sm" variant="secondary" onClick={() => feed?.step()}>Step</Button>
      {SAMPLES.map(({ label, action }) => (
        <Button key={label} size="sm" variant="outline" onClick={() => renderer?.enqueue([action])}>
          {label}
        </Button>
      ))}
    </div>
  );
}
