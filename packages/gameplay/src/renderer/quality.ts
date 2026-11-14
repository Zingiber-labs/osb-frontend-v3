export type Quality = "high" | "low";

export type QualityEnv = { coarsePointer: boolean; width: number; cores: number; override?: string | null };

export function pickQuality(env: QualityEnv): Quality {
  if (env.override === "high" || env.override === "low") return env.override;
  if (env.coarsePointer || env.width < 768 || env.cores < 4) return "low";
  return "high";
}

/** Browser detection; call once at mount. Safe in jsdom (falls back to high). */
export function detectQuality(): Quality {
  if (typeof window === "undefined") return "high";
  const coarsePointer = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)").matches : false;
  const override = new URLSearchParams(window.location.search).get("quality");
  return pickQuality({ coarsePointer, width: window.innerWidth, cores: navigator.hardwareConcurrency ?? 4, override });
}
