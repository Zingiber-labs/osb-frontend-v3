import { useEffect, useRef, useState } from "react";
import { NULL_RENDERER, type RendererPort } from "../renderer/RendererPort";
import type { ScenarioRenderer } from "../renderer/ScenarioRenderer";

// One shared import promise: strict mode mounts twice and concurrent dynamic imports of the same module are redundant.
let rendererModule: Promise<typeof import("../renderer/ScenarioRenderer")> | null = null;
const loadRenderer = () => (rendererModule ??= import("../renderer/ScenarioRenderer"));

type Props = { onReady: (renderer: RendererPort) => void };

export function ScenarioCanvas({ onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: ScenarioRenderer | null = null;
    let cancelled = false;
    let mounted = false;

    loadRenderer()
      .then(async ({ ScenarioRenderer: Renderer }) => {
        const r = new Renderer();
        renderer = r;
        await r.mount(host);
        mounted = true;
        if (cancelled) {
          r.destroy();
          return;
        }
        onReady(r);
      })
      .catch((err: unknown) => {
        console.warn("scene could not start, running HUD-only", err);
        if (!cancelled) {
          setFallback(true);
          onReady(NULL_RENDERER);
        }
      });

    return () => {
      cancelled = true;
      if (mounted) renderer?.destroy();
    };
  }, [onReady]);

  return (
    <div className="relative min-h-[360px] flex-1">
      <div ref={hostRef} className="absolute inset-0" />
      {fallback ? (
        <p className="absolute inset-x-0 bottom-4 text-center text-slate-400">HUD-only mode: the scene could not start in this browser.</p>
      ) : null}
    </div>
  );
}
