import { useEffect, useRef, useState } from "react";
import { NULL_RENDERER, type RendererPort } from "@/features/gameplay/renderer/RendererPort";
import { ScenarioRenderer } from "@/features/gameplay/renderer/ScenarioRenderer";

type Props = { onReady: (renderer: RendererPort) => void };

export function ScenarioCanvas({ onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new ScenarioRenderer();
    let cancelled = false;
    let mounted = false;

    renderer
      .mount(canvas)
      .then(() => {
        mounted = true;
        if (cancelled) {
          renderer.destroy();
          return;
        }
        onReady(renderer);
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
      if (mounted) renderer.destroy();
    };
  }, [onReady]);

  return (
    <div className="relative min-h-[360px] flex-1">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {fallback ? (
        <p className="absolute inset-x-0 bottom-4 text-center text-slate-400">HUD-only mode: the scene could not start in this browser.</p>
      ) : null}
    </div>
  );
}
