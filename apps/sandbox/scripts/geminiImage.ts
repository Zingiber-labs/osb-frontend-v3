/// <reference types="node" />

export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9";

export type ImageRequest = {
  contents: { parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> }[];
  generationConfig: { responseModalities: ["IMAGE"]; imageConfig: { aspectRatio: AspectRatio; imageSize?: "1K" | "2K" } };
};

export function buildImageRequest(
  prompt: string,
  opts: { aspectRatio: AspectRatio; reference?: { mimeType: string; base64: string }; imageSize?: "1K" | "2K" },
): ImageRequest {
  const parts: ImageRequest["contents"][number]["parts"] = [];
  if (opts.reference) parts.push({ inlineData: { mimeType: opts.reference.mimeType, data: opts.reference.base64 } });
  parts.push({ text: prompt });
  const imageConfig: ImageRequest["generationConfig"]["imageConfig"] = { aspectRatio: opts.aspectRatio };
  if (opts.imageSize) imageConfig.imageSize = opts.imageSize;
  return { contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"], imageConfig } };
}

type Part = { text?: string; inlineData?: { mimeType: string; data: string } };

/** First inline image in the response, decoded; null when the model answered with text only. */
export function extractPng(response: unknown): Buffer | null {
  const candidates = (response as { candidates?: { content?: { parts?: Part[] } }[] }).candidates ?? [];
  for (const c of candidates) {
    for (const p of c.content?.parts ?? []) {
      if (p.inlineData?.data) return Buffer.from(p.inlineData.data, "base64");
    }
  }
  return null;
}

/** `setx` writes the user registry but running shells keep their old environment, so fall back to it. */
export function resolveApiKey(env: NodeJS.ProcessEnv, readUserEnv: (name: string) => string | undefined): string | undefined {
  return env.GEMINI_API_KEY || readUserEnv("GEMINI_API_KEY") || undefined;
}

export type ArtAsset = "ship" | "shipDamage1" | "shipDamage2" | "shipDamage3" | "enemyScout" | "enemyFighter" | "enemyCruiser" | "planet";

export type ArtSpec = { prompt: string; aspectRatio: AspectRatio; editOf?: ArtAsset };

const STYLE = "Clean stylised sci-fi game sprite, crisp edges, soft studio lighting, high detail, centred, on a pure solid black background (#000000) with nothing else in frame, no text, no watermark, no ground plane, no stars.";

const SHIP_LOOK = "a sleek single-pilot space fighter with a white and cyan hull, dark grey panel lines and glowing cyan accents";

export const ART_PROMPTS: Record<ArtAsset, ArtSpec> = {
  ship: {
    aspectRatio: "1:1",
    prompt: `Rear three-quarter view of ${SHIP_LOOK}, seen from slightly above and behind as if chasing it. Its nose points away toward the horizon, the two engine nozzles face the camera and glow bright cyan-white. Wings level, symmetric. ${STYLE}`,
  },
  shipDamage1: {
    aspectRatio: "1:1",
    editOf: "ship",
    prompt: "Keep this exact ship, camera angle, framing and the solid black background identical. Add light battle damage: a few dark scorch marks and scratches on the hull. Do not change the silhouette or the engine glow.",
  },
  shipDamage2: {
    aspectRatio: "1:1",
    editOf: "ship",
    prompt: "Keep this exact ship, camera angle, framing and the solid black background identical. Add medium battle damage: scorched panels, visible cracks, small sparks and one engine glow dimmer than the other. Do not change the silhouette.",
  },
  shipDamage3: {
    aspectRatio: "1:1",
    editOf: "ship",
    prompt: "Keep this exact ship, camera angle, framing and the solid black background identical. Add heavy battle damage: charred hull, torn panels with exposed glowing orange innards, thin smoke trails, one engine dark. Do not change the silhouette.",
  },
  enemyScout: {
    aspectRatio: "1:1",
    prompt: `Head-on view, seen slightly from above, of a small agile enemy space scout fighter approaching the camera: narrow angular dark grey hull with red glowing accents and a single red cockpit light, symmetric. ${STYLE}`,
  },
  enemyFighter: {
    aspectRatio: "1:1",
    prompt: `Head-on view, seen slightly from above, of a mid-size enemy space fighter approaching the camera: wide angular dark grey hull, two forward cannons, red glowing accents and engine lights, symmetric. ${STYLE}`,
  },
  enemyCruiser: {
    aspectRatio: "1:1",
    prompt: `Head-on view, seen slightly from above, of a heavy enemy space cruiser approaching the camera: bulky armoured dark grey hull with layered plating, four forward cannons, red glowing accents and bridge lights, symmetric. ${STYLE}`,
  },
  planet: {
    aspectRatio: "1:1",
    prompt: "A gas giant planet filling most of the frame, banded in warm ochre, rust and cream with a thin pale ring seen at a slight angle, the right third of the planet falling into deep navy-blue shadow (not black), lit from the upper left. Photoreal space-art style, no stars, no text, on a pure solid black background (#000000).",
  },
};
