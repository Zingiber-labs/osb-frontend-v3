import { useCallback, useState } from "react";
import { ScenarioCanvas } from "@/features/gameplay/components/ScenarioCanvas";
import type { RendererPort } from "@/features/gameplay/renderer/RendererPort";
import { SandboxControls } from "./SandboxControls";

/** The scene with no feed and no game data: every renderer action can be fired by hand. */
export function SandboxPage() {
  const [renderer, setRenderer] = useState<RendererPort | null>(null);
  const handleReady = useCallback((r: RendererPort) => setRenderer(r), []);

  return (
    <section className="relative flex flex-1 flex-col">
      <h1 className="sr-only">Sandbox</h1>
      <ScenarioCanvas onReady={handleReady} />
      <SandboxControls renderer={renderer} />
    </section>
  );
}
