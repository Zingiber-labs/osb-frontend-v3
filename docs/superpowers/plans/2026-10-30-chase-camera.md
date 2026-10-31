# Chase Camera and Generated Rear-View Art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the side-scrolling ship scene into a behind-the-ship chase view with depth, using new Gemini-generated rear-view art, while keeping PixiJS, the engine and every existing test.

**Architecture:** A pure projector (`projection.ts`) maps world points `{x, y, z}` to screen position and scale through a vanishing point. Stars, rocks and squadron members carry world coordinates and are projected every frame into one depth-sorted container; the player ship is a fixed screen sprite at the bottom center. Animations tween in world space and project. Art comes from a Node script that calls the Gemini image API and a Python script that keys the black background.

**Tech Stack:** Vite 8, React 19, TypeScript 6 strict, PixiJS 8.22, pixi-filters 6, Vitest 5 (jsdom), tsx for scripts, Python 3.10 with PIL 11, numpy, scipy for art keying, Gemini REST API (`gemini-3.1-flash-image`, optional `gemini-3-pro-image`).

Spec: `docs/superpowers/specs/2026-10-30-chase-camera-design.md`.

## Global Constraints

- TypeScript strict with `erasableSyntaxOnly`: no constructor parameter properties, no enums. `verbatimModuleSyntax`: use `import type` for types. `noUnusedLocals` and `noUnusedParameters` fail the build.
- Engine (`features/gameplay/engine/`) and feeds never import React or pixi.js and do not change in this plan.
- `ShipAction` types and the `DURATION` table in `animations.ts` keep their current values; only how actions look changes.
- The renderer owns its canvas (`mount(host)` appends, `destroy()` removes); never share a canvas across React strict-mode mounts.
- Pixi never loads in jsdom: anything imported by a `.test.ts` file must be pure (no `pixi.js` import). Keep models pure and views thin, like `squadron.ts` vs `squadronView.ts`.
- Design space is 1280 x 720. Every constant in this plan is in design pixels. World units equal design pixels at depth `z = FOCAL` (400).
- Sprite files are stored exactly as drawn on screen. The quarter-turn rotation (`FACE_RIGHT`) is removed.
- Secrets: `GEMINI_API_KEY` is read from the process environment, with a Windows user-registry fallback. Never print it, never commit it. Raw generations go to `.superpowers/art/` which is git-ignored.
- Commits: Oscar decides when to commit. The commit steps below run only if he authorizes per-task commits for this phase at the start of execution; otherwise skip them and leave the work staged in the tree. Commit messages never mention Claude.
- Work on branch `feat/chase-camera` from `master` (head e36d9eb).
- Visual checks use `agent-browser` against `npm run dev` on port 5173 (do not use `wait --load networkidle`, it hangs on Vite; sleep instead; screenshot paths must be absolute Windows paths). Animations are checked with `agent-browser record start <abs path> <url>` plus ffmpeg frame extraction.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `scripts/geminiImage.ts` (new) | Pure helpers: build a `generateContent` request body for text or image-to-image, parse the PNG out of the response, resolve the API key. Unit-tested. |
| `scripts/gen-art.ts` (new) | CLI: prompts per asset, calls Gemini, writes `.superpowers/art/raw/<asset>-<n>.png`. |
| `scripts/key-art.py` (new) | CLI: keys black background, trims, downscales, writes to `public/sprites/`. |
| `src/features/gameplay/renderer/projection.ts` (new) | Pure: `DESIGN`, `DEFAULT_VIEW`, `project`, `toWorld`, `zIndexFor`, `fitStage`, `lerp3`, `SHIP_WORLD`, `CANNONS`. |
| `src/features/gameplay/renderer/starfield.ts` (new) | Pure `StarfieldModel` (points with depth, respawn, warp). |
| `src/features/gameplay/renderer/starfieldView.ts` (new) | Draws the model into one `Graphics` each frame. |
| `src/features/gameplay/renderer/reticle.ts` (new) | Crosshair view: `aimAt`, `release`, `flash`. |
| `src/features/gameplay/renderer/squadron.ts` (modified) | Members gain `z`; anchors are world points; entry by depth; `takeNearest` by screen distance. |
| `src/features/gameplay/renderer/squadronView.ts` (modified) | Projects members, sets scale and zIndex. |
| `src/features/gameplay/renderer/spriteUtils.ts` (modified) | No rotation; new scale constants; `aimAlong` helper. |
| `src/features/gameplay/renderer/spriteManifest.ts` (modified) | Adds `planet`; comment reflects the new convention. |
| `src/features/gameplay/renderer/world.ts` (rewritten) | Root container with cover-fit, layers, planet, ship rig, engine glows, rocks with depth, vignette. |
| `src/features/gameplay/renderer/ScenarioRenderer.ts` (modified) | Idle loop drives starfield, rocks, bob, bank, squadron; resize handler. |
| `src/features/gameplay/renderer/callout.ts` (modified) | Optional depth size factor. |
| `src/features/gameplay/renderer/animations.ts` (rewritten) | All nine actions in the chase view. |
| `public/sprites/*.png`, `public/sprites/CREDITS.md` | New ship, damage states, enemies, planet; provenance. |
| `CLAUDE.md`, `README.md` | Renderer notes updated. |

---

### Task 1: Gemini image helpers and the generation CLI

**Files:**
- Create: `scripts/geminiImage.ts`
- Create: `scripts/geminiImage.test.ts`
- Create: `scripts/gen-art.ts`
- Modify: `package.json` (scripts)
- Modify: `.gitignore` (already ignores `.superpowers/`; verify, no change expected)

**Interfaces:**
- Produces: `buildImageRequest(prompt: string, opts: { aspectRatio: AspectRatio; reference?: { mimeType: string; base64: string }; imageSize?: "1K" | "2K" }): ImageRequest`; `extractPng(response: unknown): Buffer | null`; `resolveApiKey(env: NodeJS.ProcessEnv, readUserEnv: (name: string) => string | undefined): string | undefined`; `ART_PROMPTS: Record<ArtAsset, ArtSpec>` with `ArtAsset = "ship" | "shipDamage1" | "shipDamage2" | "shipDamage3" | "enemyScout" | "enemyFighter" | "enemyCruiser" | "planet"`.

- [ ] **Step 1: Write the failing tests**

`scripts/geminiImage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ART_PROMPTS, buildImageRequest, extractPng, resolveApiKey } from "./geminiImage";

describe("buildImageRequest", () => {
  it("asks for an image with the aspect ratio and no reference", () => {
    const req = buildImageRequest("a ship", { aspectRatio: "1:1" });
    expect(req.contents).toEqual([{ parts: [{ text: "a ship" }] }]);
    expect(req.generationConfig).toEqual({ responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } });
  });

  it("puts a reference image before the prompt for edits and passes imageSize", () => {
    const req = buildImageRequest("add scorch marks", { aspectRatio: "1:1", reference: { mimeType: "image/png", base64: "QUJD" }, imageSize: "2K" });
    expect(req.contents[0].parts).toEqual([{ inlineData: { mimeType: "image/png", data: "QUJD" } }, { text: "add scorch marks" }]);
    expect(req.generationConfig.imageConfig).toEqual({ aspectRatio: "1:1", imageSize: "2K" });
  });
});

describe("extractPng", () => {
  it("returns the first inline image as a buffer", () => {
    const res = { candidates: [{ content: { parts: [{ text: "here" }, { inlineData: { mimeType: "image/png", data: Buffer.from("png!").toString("base64") } }] } }] };
    expect(extractPng(res)?.toString()).toBe("png!");
  });

  it("returns null when there is no image part", () => {
    expect(extractPng({ candidates: [{ content: { parts: [{ text: "refused" }] } }] })).toBeNull();
    expect(extractPng({})).toBeNull();
  });
});

describe("resolveApiKey", () => {
  it("prefers the process environment and falls back to the user registry", () => {
    expect(resolveApiKey({ GEMINI_API_KEY: "env" }, () => "reg")).toBe("env");
    expect(resolveApiKey({}, (n) => (n === "GEMINI_API_KEY" ? "reg" : undefined))).toBe("reg");
    expect(resolveApiKey({}, () => undefined)).toBeUndefined();
  });
});

describe("ART_PROMPTS", () => {
  it("covers every asset, edits reference the clean ship, every prompt demands a black background", () => {
    const keys = Object.keys(ART_PROMPTS);
    expect(keys.sort()).toEqual(["enemyCruiser", "enemyFighter", "enemyScout", "planet", "ship", "shipDamage1", "shipDamage2", "shipDamage3"].sort());
    for (const k of ["shipDamage1", "shipDamage2", "shipDamage3"] as const) expect(ART_PROMPTS[k].editOf).toBe("ship");
    for (const spec of Object.values(ART_PROMPTS)) expect(spec.prompt.toLowerCase()).toContain("black background");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run scripts/geminiImage.test.ts`
Expected: FAIL, cannot find module `./geminiImage`.

- [ ] **Step 3: Write `scripts/geminiImage.ts`**

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run scripts/geminiImage.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Write the CLI `scripts/gen-art.ts`**

```ts
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ART_PROMPTS, buildImageRequest, extractPng, resolveApiKey, type ArtAsset } from "./geminiImage";

const RAW_DIR = ".superpowers/art/raw";
const DEFAULT_MODEL = "gemini-3.1-flash-image";

function readUserEnv(name: string): string | undefined {
  if (process.platform !== "win32") return undefined;
  try {
    const out = execFileSync("reg", ["query", "HKCU\\Environment", "/v", name], { encoding: "utf8" });
    const m = out.match(/REG_\w+\s+(.+)\s*$/m);
    return m?.[1]?.trim();
  } catch {
    return undefined;
  }
}

function parseArgs(argv: string[]) {
  const assets: ArtAsset[] = [];
  let n = 1;
  let model = DEFAULT_MODEL;
  let imageSize: "1K" | "2K" | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--n") n = Number(argv[++i]);
    else if (a === "--model") model = argv[++i];
    else if (a === "--size") imageSize = argv[++i] as "1K" | "2K";
    else if (a === "--all") assets.push(...(Object.keys(ART_PROMPTS) as ArtAsset[]));
    else if (a in ART_PROMPTS) assets.push(a as ArtAsset);
    else {
      console.error(`unknown asset or flag: ${a}`);
      process.exit(1);
    }
  }
  if (assets.length === 0) {
    console.error(`usage: npm run gen-art -- <asset ...|--all> [--n 2] [--model ${DEFAULT_MODEL}] [--size 2K]\nassets: ${Object.keys(ART_PROMPTS).join(", ")}`);
    process.exit(1);
  }
  return { assets, n, model, imageSize };
}

async function generate(apiKey: string, model: string, asset: ArtAsset, variant: number, imageSize?: "1K" | "2K") {
  const spec = ART_PROMPTS[asset];
  let reference: { mimeType: string; base64: string } | undefined;
  if (spec.editOf) {
    // Edits start from the chosen clean render, which must have been copied to raw/<editOf>.png.
    const base = await readFile(`${RAW_DIR}/${spec.editOf}.png`);
    reference = { mimeType: "image/png", base64: base.toString("base64") };
  }
  const body = buildImageRequest(spec.prompt, { aspectRatio: spec.aspectRatio, reference, imageSize });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": apiKey }, body: JSON.stringify(body) });
  const json: unknown = await res.json();
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } }).error?.message ?? res.statusText;
    throw new Error(`${asset}: Gemini responded ${res.status}: ${msg}`);
  }
  const png = extractPng(json);
  if (!png) throw new Error(`${asset}: no image in the response (model answered with text only)`);
  const out = `${RAW_DIR}/${asset}-${variant}.png`;
  await writeFile(out, png);
  console.log(`wrote ${out} (${(png.length / 1024).toFixed(0)} KiB)`);
}

const { assets, n, model, imageSize } = parseArgs(process.argv.slice(2));
const apiKey = resolveApiKey(process.env, readUserEnv);
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set (environment or Windows user registry)");
  process.exit(1);
}
await mkdir(RAW_DIR, { recursive: true });
for (const asset of assets) {
  for (let v = 1; v <= n; v += 1) {
    try {
      await generate(apiKey, model, asset, v, imageSize);
    } catch (err) {
      console.error(String(err));
    }
  }
}
```

Add to `package.json` scripts: `"gen-art": "tsx scripts/gen-art.ts"`.

- [ ] **Step 6: Type-check and smoke-run the usage path**

Run: `npx tsc -p tsconfig.scripts.json --noEmit` → no errors.
Run: `npm run gen-art` → prints the usage line and exits 1 (no network call).

- [ ] **Step 7: Commit (if authorized)**

```bash
git add scripts/geminiImage.ts scripts/geminiImage.test.ts scripts/gen-art.ts package.json
git commit -m "feat(scripts): Gemini image generation CLI with prompts for the chase-view art"
```

---

### Task 2: Background keying script

**Files:**
- Create: `scripts/key-art.py`

**Interfaces:**
- Produces: `python scripts/key-art.py <in.png> <out.png> --width <px> [--mode solid|glow] [--threshold 28] [--pad 4]`.

- [ ] **Step 1: Write the script**

```python
"""Key a generated sprite off its solid black background, trim, downscale, save as RGBA PNG.

solid mode: pixels connected to the border and darker than --threshold become transparent
            (flood fill), so dark details inside the sprite survive. Edge pixels get a soft alpha.
glow mode:  alpha follows brightness everywhere and colour is un-premultiplied (for lasers, flames).
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage


def key_solid(rgb: np.ndarray, threshold: int) -> np.ndarray:
    lum = rgb.max(axis=2)
    dark = lum < threshold
    labels, _ = ndimage.label(dark)
    border = np.unique(np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]]))
    border = border[border != 0]
    background = np.isin(labels, border)
    alpha = np.where(background, 0, 255).astype(np.uint8)
    # Soften the one-pixel rim: where a kept pixel touches background, scale alpha by its brightness.
    rim = ndimage.binary_dilation(background) & ~background
    soft = np.clip((lum.astype(np.int32) - threshold) * 255 // max(1, 96 - threshold), 0, 255).astype(np.uint8)
    alpha[rim] = np.maximum(soft[rim], 40)
    return alpha


def key_glow(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    lum = rgb.max(axis=2).astype(np.float32)
    alpha = np.clip(lum, 0, 255)
    safe = np.where(alpha > 0, alpha, 1)[..., None]
    colour = np.clip(rgb.astype(np.float32) * 255 / safe, 0, 255)
    return colour.astype(np.uint8), alpha.astype(np.uint8)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--width", type=int, required=True, help="output width in px")
    ap.add_argument("--mode", choices=["solid", "glow"], default="solid")
    ap.add_argument("--threshold", type=int, default=28)
    ap.add_argument("--pad", type=int, default=4)
    args = ap.parse_args()

    img = Image.open(args.src).convert("RGB")
    rgb = np.asarray(img)
    if args.mode == "solid":
        alpha = key_solid(rgb, args.threshold)
        rgba = np.dstack([rgb, alpha])
    else:
        colour, alpha = key_glow(rgb)
        rgba = np.dstack([colour, alpha])

    ys, xs = np.nonzero(rgba[..., 3] > 8)
    if len(xs) == 0:
        raise SystemExit("nothing left after keying; lower --threshold or check the input")
    x0, x1 = max(0, xs.min() - args.pad), min(rgba.shape[1], xs.max() + 1 + args.pad)
    y0, y1 = max(0, ys.min() - args.pad), min(rgba.shape[0], ys.max() + 1 + args.pad)
    out = Image.fromarray(rgba[y0:y1, x0:x1], "RGBA")
    h = round(out.height * args.width / out.width)
    out = out.resize((args.width, h), Image.LANCZOS)
    out.save(args.dst, optimize=True)
    print(f"wrote {args.dst} {out.width}x{out.height}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Smoke-test with a synthetic image**

Run (from the project root, Bash):

```bash
mkdir -p .superpowers/art/tmp && python - <<'PY'
from PIL import Image, ImageDraw
im = Image.new("RGB", (400, 400), (0, 0, 0))
d = ImageDraw.Draw(im)
d.ellipse((100, 100, 300, 300), fill=(90, 200, 255))
d.rectangle((180, 180, 220, 220), fill=(20, 20, 20))   # dark detail enclosed by the shape must survive
im.save(".superpowers/art/tmp/fake.png")
PY
python scripts/key-art.py .superpowers/art/tmp/fake.png .superpowers/art/tmp/fake_keyed.png --width 100
python - <<'PY'
from PIL import Image
im = Image.open(".superpowers/art/tmp/fake_keyed.png"); print(im.size, im.mode)
a = im.getchannel("A"); print("corner alpha", a.getpixel((0, 0)), "dark detail alpha", a.getpixel((50, 50)), "rim alpha", a.getpixel((50, 3)))
PY
```

Expected: `wrote ... 100x100`, mode RGBA, corner alpha 0, dark detail alpha 255 (the dark square is enclosed by the circle, so it is not connected to the border and survives the flood fill), rim alpha somewhere between 1 and 255.

- [ ] **Step 3: Commit (if authorized)**

```bash
git add scripts/key-art.py
git commit -m "feat(scripts): key generated sprites off their black background"
```

---

### Task 3: Generate, review and install the art

This task has a human gate: Oscar picks the candidates. Do not replace files in `public/sprites/` before he approves.

**Files:**
- Create: `.superpowers/art/raw/*.png` (ignored)
- Modify: `public/sprites/ship.png`, `ship_damage1..3.png`, `enemy_scout.png`, `enemy_fighter.png`, `enemy_cruiser.png`
- Create: `public/sprites/planet.png`
- Modify: `public/sprites/CREDITS.md`
- Modify: `src/features/gameplay/renderer/spriteManifest.ts`, `spriteManifest.test.ts`

**Interfaces:**
- Produces: `SPRITE_FILES.planet = "planet.png"`; file widths: ship 520 px, enemies 400 px, planet 700 px (stored at 2x, drawn at 0.5 base scale in Task 8).

- [ ] **Step 1: Generate candidates**

```bash
npm run gen-art -- ship --n 3
npm run gen-art -- ship --n 1 --model gemini-3-pro-image   # may fail on quota; that is fine
npm run gen-art -- enemyScout enemyFighter enemyCruiser planet --n 2
```

Produce a contact sheet so Oscar can compare in one image:

```bash
python - <<'PY'
from PIL import Image
import glob, math
files = sorted(glob.glob(".superpowers/art/raw/*.png"))
thumbs = [Image.open(f).convert("RGB").resize((256, 256)) for f in files]
cols = 4; rows = math.ceil(len(thumbs) / cols)
sheet = Image.new("RGB", (cols * 256, rows * 256))
for i, t in enumerate(thumbs): sheet.paste(t, ((i % cols) * 256, (i // cols) * 256))
sheet.save(".superpowers/art/contact.png"); print(files)
PY
```

Show `.superpowers/art/contact.png` to Oscar with the file list. Re-roll any asset he rejects (`npm run gen-art -- <asset> --n 2`).

- [ ] **Step 2: Damage states from the chosen ship**

Copy the chosen ship to `.superpowers/art/raw/ship.png`, then:

```bash
npm run gen-art -- shipDamage1 shipDamage2 shipDamage3 --n 1
```

Check each result keeps the silhouette (overlay at 50% alpha on the clean ship in a quick PIL composite). If one drifts, re-roll once; if it still drifts, fall back to procedural scorches: darken random elliptical patches of the clean render with PIL (`ImageDraw.ellipse` with semi-transparent black and a few orange cracks), the same approach as the 2026-10-21 pass.

- [ ] **Step 3: Key and install**

```bash
python scripts/key-art.py .superpowers/art/raw/ship.png          public/sprites/ship.png          --width 520
python scripts/key-art.py .superpowers/art/raw/shipDamage1-1.png public/sprites/ship_damage1.png  --width 520
python scripts/key-art.py .superpowers/art/raw/shipDamage2-1.png public/sprites/ship_damage2.png  --width 520
python scripts/key-art.py .superpowers/art/raw/shipDamage3-1.png public/sprites/ship_damage3.png  --width 520
python scripts/key-art.py .superpowers/art/raw/enemyScout-N.png   public/sprites/enemy_scout.png   --width 400
python scripts/key-art.py .superpowers/art/raw/enemyFighter-N.png public/sprites/enemy_fighter.png --width 400
python scripts/key-art.py .superpowers/art/raw/enemyCruiser-N.png public/sprites/enemy_cruiser.png --width 400
python scripts/key-art.py .superpowers/art/raw/planet-N.png       public/sprites/planet.png        --width 700 --threshold 14
```

The four damage files must share the clean ship's exact pixel size so they overlay: after keying, if sizes differ, pad or crop the damage files to `ship.png`'s size centred (PIL `ImageOps.pad` with a transparent fill). Verify:

```bash
python -c "from PIL import Image; import glob; [print(f, Image.open(f).size) for f in sorted(glob.glob('public/sprites/*.png'))]"
```

- [ ] **Step 4: Manifest and credits**

In `spriteManifest.ts` replace the doc comment and add the planet:

```ts
/**
 * Sprites are stored exactly as drawn on screen (chase view: the player ship from behind, enemies
 * head-on). The ship, damage states, enemies and planet are stored at 2x and drawn at 0.5.
 * Damage states are full ship images drawn over the body and share its pixel size.
 */
export const SPRITE_FILES = {
  ship: "ship.png",
  shipDamage1: "ship_damage1.png",
  shipDamage2: "ship_damage2.png",
  shipDamage3: "ship_damage3.png",
  flame: "flame.png",
  bgGalaxy: "bg/galaxy.jpg",
  planet: "planet.png",
  shield: "shield.png",
  // ... rest unchanged
```

In `spriteManifest.test.ts` add `"planet"` to the roles list.

Rewrite `public/sprites/CREDITS.md`:

```markdown
# Sprite credits

- `ship.png`, `ship_damage1..3.png`, `enemy_scout.png`, `enemy_fighter.png`, `enemy_cruiser.png` and
  `planet.png` were generated for this project on 2026-10-30 with Google Gemini's image model
  (Nano Banana 2, `gemini-3.1-flash-image`) from the prompts in `scripts/geminiImage.ts`, then keyed,
  trimmed and downscaled with `scripts/key-art.py`. The damage states are image-to-image edits of the
  clean ship (or procedural scorches where noted in the plan ledger).
- `flame.png` (engine glow) is drawn procedurally (soft additive gradient), no third-party source.
- `bg/galaxy.jpg` is Outer Sports Ballers' own galaxy backdrop, downscaled.
- Lasers, shield, meteors and the explosion strip were generated with Canva's image generator on
  2026-10-21 (sheets in the Canva design "Blank black square canvas", DAHYraDWo9E).

Orientation convention: files are stored exactly as they appear on screen. The player ship is seen
from behind, enemies head-on; bolts point up in the file and are rotated along their travel.
```

- [ ] **Step 5: Run the manifest test**

Run: `npx vitest run src/features/gameplay/renderer/spriteManifest.test.ts`
Expected: PASS (both tests).

- [ ] **Step 6: Commit (if authorized)**

```bash
git add public/sprites src/features/gameplay/renderer/spriteManifest.ts src/features/gameplay/renderer/spriteManifest.test.ts
git commit -m "feat(sprites): Gemini-generated rear-view ship, head-on enemies and a planet"
```

---

### Task 4: Projection module

**Files:**
- Create: `src/features/gameplay/renderer/projection.ts`
- Create: `src/features/gameplay/renderer/projection.test.ts`

**Interfaces:**
- Produces:
  - `type Vec3 = { x: number; y: number; z: number }`, `type View = { vp: { x: number; y: number }; f: number }`, `type Projected = { sx: number; sy: number; scale: number }`
  - `DESIGN = { width: 1280, height: 720 }`, `FOCAL = 400`, `DEFAULT_VIEW = { vp: { x: 640, y: 302 }, f: 400 }`
  - `SHIP_SCREEN = { x: 640, y: 533 }`, `SHIP_WORLD: Vec3 = { x: 0, y: 231, z: 400 }`, `CANNONS: [Vec3, Vec3] = [{ x: -80, y: 215, z: 400 }, { x: 80, y: 215, z: 400 }]`, `RETICLE_HOME = { x: 640, y: 420 }`
  - `project(p: Vec3, view?: View): Projected`, `toWorld(sx: number, sy: number, z: number, view?: View): Vec3`, `zIndexFor(z: number): number`, `lerp3(a: Vec3, b: Vec3, t: number): Vec3`, `fitStage(hostWidth: number, hostHeight: number): { scale: number; x: number; y: number }`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { CANNONS, DEFAULT_VIEW, DESIGN, fitStage, lerp3, project, SHIP_SCREEN, SHIP_WORLD, toWorld, zIndexFor } from "./projection";

describe("project", () => {
  it("draws a point at depth f at native scale around the vanishing point", () => {
    const p = project({ x: 100, y: -50, z: DEFAULT_VIEW.f });
    expect(p).toEqual({ sx: 740, sy: 252, scale: 1 });
  });

  it("halves offsets and scale at twice the depth", () => {
    const p = project({ x: 100, y: -50, z: DEFAULT_VIEW.f * 2 });
    expect(p.sx).toBeCloseTo(690);
    expect(p.sy).toBeCloseTo(277);
    expect(p.scale).toBeCloseTo(0.5);
  });

  it("places the ship world point on the ship screen point", () => {
    const p = project(SHIP_WORLD);
    expect(p.sx).toBeCloseTo(SHIP_SCREEN.x);
    expect(p.sy).toBeCloseTo(SHIP_SCREEN.y);
    expect(p.scale).toBe(1);
    expect(CANNONS[0].z).toBe(SHIP_WORLD.z);
    expect(CANNONS[0].x).toBe(-CANNONS[1].x);
  });

  it("toWorld inverts project", () => {
    const w = { x: -333, y: 87, z: 1234 };
    const p = project(w);
    const back = toWorld(p.sx, p.sy, w.z);
    expect(back.x).toBeCloseTo(w.x);
    expect(back.y).toBeCloseTo(w.y);
    expect(back.z).toBe(w.z);
  });
});

describe("zIndexFor", () => {
  it("gives nearer objects a larger zIndex", () => {
    expect(zIndexFor(100)).toBeGreaterThan(zIndexFor(1000));
    expect(zIndexFor(1000)).toBeGreaterThan(zIndexFor(4000));
  });
});

describe("lerp3", () => {
  it("interpolates every axis", () => {
    expect(lerp3({ x: 0, y: 0, z: 0 }, { x: 10, y: -20, z: 400 }, 0.25)).toEqual({ x: 2.5, y: -5, z: 100 });
  });
});

describe("fitStage", () => {
  it("scales up to cover a larger 16:9 host with no offset", () => {
    expect(fitStage(1920, 1080)).toEqual({ scale: 1.5, x: 0, y: 0 });
  });

  it("covers a wider host by cropping top and bottom equally", () => {
    const f = fitStage(1280, 549);
    expect(f.scale).toBe(1);
    expect(f.x).toBe(0);
    expect(f.y).toBeCloseTo(-85.5);
  });

  it("covers a narrower host by cropping the sides equally", () => {
    expect(fitStage(800, 720)).toEqual({ scale: 1, x: -240, y: 0 });
    expect(DESIGN).toEqual({ width: 1280, height: 720 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/gameplay/renderer/projection.test.ts`
Expected: FAIL, cannot find module `./projection`.

- [ ] **Step 3: Write `projection.ts`**

```ts
/** Pure perspective helpers. The camera sits at z = 0 looking down +z; world units equal design pixels at z = FOCAL. */

export type Vec3 = { x: number; y: number; z: number };
export type View = { vp: { x: number; y: number }; f: number };
export type Projected = { sx: number; sy: number; scale: number };

export const DESIGN = { width: 1280, height: 720 } as const;
export const FOCAL = 400;
export const DEFAULT_VIEW: View = { vp: { x: 640, y: 302 }, f: FOCAL };

/** The player ship is a fixed screen sprite; this is where it sits and the world point that projects there. */
export const SHIP_SCREEN = { x: 640, y: 533 } as const;
export const SHIP_WORLD: Vec3 = { x: 0, y: SHIP_SCREEN.y - DEFAULT_VIEW.vp.y, z: FOCAL };
/** Wing cannon muzzles, in world units at the ship's depth. */
export const CANNONS: [Vec3, Vec3] = [
  { x: -80, y: SHIP_WORLD.y - 16, z: FOCAL },
  { x: 80, y: SHIP_WORLD.y - 16, z: FOCAL },
];
/** Resting position of the aiming reticle, between the ship and the vanishing point. */
export const RETICLE_HOME = { x: 640, y: 420 } as const;

export function project(p: Vec3, view: View = DEFAULT_VIEW): Projected {
  const scale = view.f / p.z;
  return { sx: view.vp.x + p.x * scale, sy: view.vp.y + p.y * scale, scale };
}

export function toWorld(sx: number, sy: number, z: number, view: View = DEFAULT_VIEW): Vec3 {
  const k = z / view.f;
  return { x: (sx - view.vp.x) * k, y: (sy - view.vp.y) * k, z };
}

/** Sortable-children key: nearer (smaller z) sorts on top. */
export function zIndexFor(z: number): number {
  return -z;
}

export function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

/** Cover-fit of the design frame onto the host: largest ratio, centred, edges cropped. */
export function fitStage(hostWidth: number, hostHeight: number): { scale: number; x: number; y: number } {
  const scale = Math.max(hostWidth / DESIGN.width, hostHeight / DESIGN.height);
  return { scale, x: (hostWidth - DESIGN.width * scale) / 2, y: (hostHeight - DESIGN.height * scale) / 2 };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/gameplay/renderer/projection.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit (if authorized)**

```bash
git add src/features/gameplay/renderer/projection.ts src/features/gameplay/renderer/projection.test.ts
git commit -m "feat(renderer): pure perspective projector and cover-fit stage math"
```

---

### Task 5: Starfield model and view

**Files:**
- Create: `src/features/gameplay/renderer/starfield.ts`
- Create: `src/features/gameplay/renderer/starfield.test.ts`
- Create: `src/features/gameplay/renderer/starfieldView.ts`

**Interfaces:**
- Consumes: `project`, `DEFAULT_VIEW`, `DESIGN`, `Vec3`, `View` from Task 4.
- Produces:
  - `type Star = Vec3 & { near: boolean; speed: number }`
  - `class StarfieldModel { stars: Star[]; warp: number; constructor(opts?: StarfieldOptions); update(dtMs: number): void; respawn(star: Star): void }` with `StarfieldOptions = { far?: number; near?: number; zNear?: number; zFar?: number; spreadX?: number; spreadY?: number; unitsPerMs?: number; view?: View; random?: () => number }`; defaults far 150, near 40, zNear 60, zFar 4000, spreadX 2600, spreadY 1600, unitsPerMs 1.1.
  - `class StarfieldView { constructor(model: StarfieldModel, layer: Container, view?: View); draw(): void; destroy(): void }`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW, DESIGN, project } from "./projection";
import { StarfieldModel } from "./starfield";

const make = (over = {}) => new StarfieldModel({ random: () => 0.5, ...over });

describe("StarfieldModel", () => {
  it("creates far and near stars spread through the depth range", () => {
    const s = make({ far: 10, near: 4 });
    expect(s.stars).toHaveLength(14);
    expect(s.stars.filter((st) => st.near)).toHaveLength(4);
    for (const st of s.stars) {
      expect(st.z).toBeGreaterThanOrEqual(60);
      expect(st.z).toBeLessThanOrEqual(4000);
    }
  });

  it("moves every star toward the camera by unitsPerMs times warp", () => {
    const s = make({ far: 3, near: 0, unitsPerMs: 2 });
    const before = s.stars.map((st) => st.z);
    s.update(10);
    s.stars.forEach((st, i) => expect(st.z).toBeCloseTo(before[i] - 20 * st.speed));
    s.warp = 4;
    const mid = s.stars.map((st) => st.z);
    s.update(10);
    s.stars.forEach((st, i) => expect(st.z).toBeCloseTo(mid[i] - 80 * st.speed));
  });

  it("respawns a star far away once it passes the near plane", () => {
    const s = make({ far: 1, near: 0 });
    const st = s.stars[0];
    st.z = 61;
    s.update(5);
    expect(st.z).toBeGreaterThan(3000);
  });

  it("respawns a star whose projection leaves the design frame", () => {
    const s = make({ far: 1, near: 0 });
    const st = s.stars[0];
    st.x = 2600;
    st.y = 0;
    st.z = 300; // projects 3466 px right of the vanishing point
    expect(project(st, DEFAULT_VIEW).sx).toBeGreaterThan(DESIGN.width);
    s.update(1);
    expect(project(st, DEFAULT_VIEW).sx).toBeLessThanOrEqual(DESIGN.width + 40);
    expect(st.z).toBeGreaterThan(3000);
  });

  it("respawn keeps stars off the exact centre line so they never sit on the vanishing point", () => {
    const s = make({ far: 1, near: 0, random: () => 0.5 });
    const st = s.stars[0];
    s.respawn(st);
    expect(Math.abs(st.x) + Math.abs(st.y)).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/gameplay/renderer/starfield.test.ts`
Expected: FAIL, cannot find module `./starfield`.

- [ ] **Step 3: Write `starfield.ts`**

```ts
import { DEFAULT_VIEW, DESIGN, project, type Vec3, type View } from "./projection";

export type Star = Vec3 & { near: boolean; speed: number };

export type StarfieldOptions = {
  far?: number;
  near?: number;
  zNear?: number;
  zFar?: number;
  spreadX?: number;
  spreadY?: number;
  unitsPerMs?: number;
  view?: View;
  random?: () => number;
};

const MARGIN = 40;
/** Keeps respawned stars out of a small square around the centre line, in world units. */
const CENTER_GAP = 120;

/** Points with depth streaming toward the camera. Pure: StarfieldView draws it. */
export class StarfieldModel {
  readonly stars: Star[] = [];
  warp = 1;
  private readonly zNear: number;
  private readonly zFar: number;
  private readonly spreadX: number;
  private readonly spreadY: number;
  private readonly unitsPerMs: number;
  private readonly view: View;
  private readonly random: () => number;

  constructor(opts: StarfieldOptions = {}) {
    this.zNear = opts.zNear ?? 60;
    this.zFar = opts.zFar ?? 4000;
    this.spreadX = opts.spreadX ?? 2600;
    this.spreadY = opts.spreadY ?? 1600;
    this.unitsPerMs = opts.unitsPerMs ?? 1.1;
    this.view = opts.view ?? DEFAULT_VIEW;
    this.random = opts.random ?? Math.random;
    const far = opts.far ?? 150;
    const near = opts.near ?? 40;
    for (let i = 0; i < far + near; i += 1) {
      const star: Star = { x: 0, y: 0, z: 0, near: i >= far, speed: 0.8 + this.random() * 0.4 };
      this.respawn(star);
      // Initial fill: spread through the whole depth range instead of all starting far away.
      star.z = this.zNear + this.random() * (this.zFar - this.zNear);
      this.stars.push(star);
    }
  }

  respawn(star: Star): void {
    let x = (this.random() * 2 - 1) * this.spreadX;
    let y = (this.random() * 2 - 1) * this.spreadY;
    if (Math.abs(x) < CENTER_GAP && Math.abs(y) < CENTER_GAP) {
      x = x >= 0 ? CENTER_GAP : -CENTER_GAP;
      y = y >= 0 ? CENTER_GAP : -CENTER_GAP;
    }
    star.x = x;
    star.y = y;
    star.z = this.zFar * (0.8 + this.random() * 0.2);
  }

  update(dtMs: number): void {
    const step = this.unitsPerMs * this.warp * dtMs;
    for (const st of this.stars) {
      st.z -= step * st.speed;
      if (st.z < this.zNear) {
        this.respawn(st);
        continue;
      }
      const p = project(st, this.view);
      if (p.sx < -MARGIN || p.sx > DESIGN.width + MARGIN || p.sy < -MARGIN || p.sy > DESIGN.height + MARGIN) this.respawn(st);
    }
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/gameplay/renderer/starfield.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write `starfieldView.ts`**

```ts
import { Graphics, type Container } from "pixi.js";
import { DEFAULT_VIEW, project, type View } from "./projection";
import type { StarfieldModel } from "./starfield";

const STAR_COLOR = 0xffffff;
/** How far back along the stream a near star's streak reaches, in ms of travel. */
const STREAK_MS = 45;

/** One Graphics redrawn per frame: dots sized and faded by depth, near stars with motion streaks. */
export class StarfieldView {
  private readonly model: StarfieldModel;
  private readonly view: View;
  private readonly g = new Graphics();

  constructor(model: StarfieldModel, layer: Container, view: View = DEFAULT_VIEW) {
    this.model = model;
    this.view = view;
    // Stars sit behind everything else in the sortable depth layer.
    this.g.zIndex = -1e9;
    layer.addChild(this.g);
  }

  draw(unitsPerMs = 1.1): void {
    const g = this.g;
    g.clear();
    const warp = this.model.warp;
    for (const st of this.model.stars) {
      const p = project(st, this.view);
      const depth = Math.min(1, p.scale * 1.5); // 0 far .. 1 near
      const alpha = 0.2 + depth * 0.8;
      const r = (st.near ? 1.6 : 0.9) * (0.5 + depth);
      if (st.near || warp > 1.5) {
        const back = project({ x: st.x, y: st.y, z: st.z + unitsPerMs * warp * STREAK_MS * st.speed }, this.view);
        g.moveTo(back.sx, back.sy).lineTo(p.sx, p.sy).stroke({ width: r, color: STAR_COLOR, alpha: alpha * 0.7 });
      }
      g.circle(p.sx, p.sy, r).fill({ color: STAR_COLOR, alpha });
    }
  }

  destroy(): void {
    this.g.destroy();
  }
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors (the view is not wired yet; unused exports are fine).

- [ ] **Step 7: Commit (if authorized)**

```bash
git add src/features/gameplay/renderer/starfield.ts src/features/gameplay/renderer/starfield.test.ts src/features/gameplay/renderer/starfieldView.ts
git commit -m "feat(renderer): depth starfield model and streaked view"
```

---

### Task 6: Squadron in depth

**Files:**
- Modify: `src/features/gameplay/renderer/squadron.ts`
- Modify: `src/features/gameplay/renderer/squadron.test.ts`
- Modify: `src/features/gameplay/renderer/squadronView.ts`
- Modify: `src/features/gameplay/renderer/spriteUtils.ts`

**Interfaces:**
- Consumes: `project`, `zIndexFor`, `Vec3`, `View`, `DEFAULT_VIEW` from Task 4.
- Produces:
  - `Member` gains `z: number`; `anchor(slot): Vec3`; constructor options drop `width/height` and gain `view?: View`; `ENTER_Z = 3600`; `takeNearest(sx: number, sy: number): Member | null` compares projected screen distance; `pick()`, `takeAny()`, `spawn()`, `freeSlot()`, `update()` keep their signatures.
  - `SquadronView.sync()` projects; `positionOf(id)` returns `{ x, y, scale }`; `detach(id)` unchanged.
  - `spriteUtils.ts`: `sprite(tex, scale = 1): Sprite` (anchor 0.5, no rotation); `SHIP_SCALE = 0.5`; `ENEMY_SCALE = { scout: 0.32, fighter: 0.42, cruiser: 0.55 }`; `PLANET_SCALE = 0.5`; `aimAlong(s: Sprite, from: {x,y}, to: {x,y}): void` sets rotation so an up-pointing bolt points from `from` to `to`.

- [ ] **Step 1: Update the tests**

Replace `squadron.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { project } from "./projection";
import { ENTER_Z, SquadronModel } from "./squadron";

const make = (over = {}) => new SquadronModel({ random: () => 0, ...over });
const screenOf = (s: SquadronModel, slot: number) => project(s.anchor(slot));

describe("SquadronModel", () => {
  it("fills three slots with entering members far away, sizes rotating scout, fighter, cruiser", () => {
    const s = make();
    expect(s.members).toHaveLength(3);
    expect(s.members.map((m) => m.slot)).toEqual([0, 1, 2]);
    expect(s.members.map((m) => m.size)).toEqual(["scout", "fighter", "cruiser"]);
    expect(s.members.every((m) => m.state === "entering")).toBe(true);
    expect(s.members.every((m) => m.z === ENTER_Z)).toBe(true);
  });

  it("anchors form a V ahead of the ship at three depths", () => {
    const s = make();
    expect(s.anchor(0)).toEqual({ x: -420, y: -60, z: 1000 });
    expect(s.anchor(1)).toEqual({ x: 0, y: -120, z: 1400 });
    expect(s.anchor(2)).toEqual({ x: 440, y: -40, z: 1100 });
    const left = screenOf(s, 0);
    const right = screenOf(s, 2);
    expect(left.sx).toBeLessThan(640);
    expect(right.sx).toBeGreaterThan(640);
    expect(screenOf(s, 1).scale).toBeLessThan(left.scale);
  });

  it("brings entering members to their anchor depth over 1200 ms then holds and weaves", () => {
    const s = make();
    s.update(600);
    const mid = s.members[0];
    expect(mid.state).toBe("entering");
    expect(mid.z).toBeGreaterThan(1000);
    expect(mid.z).toBeLessThan(ENTER_Z);
    s.update(600);
    for (const m of s.members) {
      expect(m.state).toBe("holding");
      const a = s.anchor(m.slot);
      expect(m.z).toBe(a.z);
      expect(Math.abs(m.x - a.x)).toBeLessThanOrEqual(25);
      expect(Math.abs(m.y - a.y)).toBeLessThanOrEqual(40);
    }
    s.update(500);
    for (const m of s.members) {
      const a = s.anchor(m.slot);
      expect(m.x !== a.x || m.y !== a.y).toBe(true);
      expect(Math.abs(m.x - a.x)).toBeLessThanOrEqual(25);
      expect(Math.abs(m.y - a.y)).toBeLessThanOrEqual(40);
    }
  });

  it("takeNearest picks by screen distance and respawns the slot after 600 ms", () => {
    const s = make();
    s.update(1200);
    const target = screenOf(s, 2);
    const taken = s.takeNearest(target.sx, target.sy);
    expect(taken?.slot).toBe(2);
    expect(s.members).toHaveLength(2);
    s.update(599);
    expect(s.members).toHaveLength(2);
    s.update(1);
    expect(s.members).toHaveLength(3);
    const fresh = s.members.find((m) => m.slot === 2);
    expect(fresh?.state).toBe("entering");
    expect(fresh?.z).toBe(ENTER_Z);
    expect(fresh?.id).not.toBe(taken?.id);
  });

  it("takeAny empties the squadron and returns null afterwards", () => {
    const s = make();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).not.toBeNull();
    expect(s.takeAny()).toBeNull();
    expect(s.takeNearest(640, 420)).toBeNull();
    expect(s.pick()).toBeNull();
  });

  it("fast spawn enters in 400 ms and freeSlot reports an empty slot", () => {
    const s = make();
    s.takeAny();
    const slot = s.freeSlot();
    expect(slot).toBe(0);
    const m = s.spawn(slot, { fast: true });
    expect(m.enterMs).toBe(400);
    s.update(400);
    expect(s.members.find((x) => x.id === m.id)?.state).toBe("holding");
  });

  it("spawning into a slot cancels that slot's pending respawn", () => {
    const s = make();
    s.takeAny();
    s.spawn(0, { fast: true });
    s.update(700);
    expect(s.members.filter((m) => m.slot === 0)).toHaveLength(1);
  });

  // Leaves members = [slot 0 entering, slot 1 holding]: the holding member is NOT first.
  const entersFirstThenHolds = () => {
    const s = make();
    s.update(1200);
    s.takeAny(); // slot 0
    s.update(600); // slot 0 respawned, entering until clock 3000
    const a1 = screenOf(s, 1);
    const a2 = screenOf(s, 2);
    s.takeNearest(a1.sx, a1.sy); // slot 1
    s.takeNearest(a2.sx, a2.sy); // slot 2
    s.spawn(1, { fast: true });
    s.update(400); // slot 1 holds, slot 0 still entering
    expect(s.members.map((m) => m.state)).toEqual(["entering", "holding"]);
    return s;
  };

  it("pick prefers a holding member and never removes it", () => {
    const s = entersFirstThenHolds();
    const p = s.pick();
    expect(p?.state).toBe("holding");
    expect(p?.slot).toBe(1);
    expect(s.members).toHaveLength(2);
  });

  it("takeAny prefers a holding member", () => {
    const s = make();
    s.update(1200);
    s.takeAny();
    s.update(600); // slot 0 respawned, entering
    expect(s.takeAny()?.slot).toBe(1);
    const t = entersFirstThenHolds();
    const taken = t.takeAny();
    expect(taken?.state).toBe("holding");
    expect(taken?.slot).toBe(1);
    expect(t.members).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/gameplay/renderer/squadron.test.ts`
Expected: FAIL (no `ENTER_Z` export, anchors wrong, `z` undefined).

- [ ] **Step 3: Rewrite `squadron.ts`**

```ts
import type { EnemySize } from "@/features/gameplay/engine/types";
import { DEFAULT_VIEW, project, type Vec3, type View } from "./projection";

export type MemberState = "entering" | "holding";

export type Member = Vec3 & {
  id: number;
  slot: number;
  size: EnemySize;
  state: MemberState;
  enterMs: number;
  elapsed: number;
  seed: number;
};

export type SquadronOptions = {
  slots?: number;
  respawnDelayMs?: number;
  enterMs?: number;
  fastEnterMs?: number;
  view?: View;
  random?: () => number;
};

const SIZES: EnemySize[] = ["scout", "fighter", "cruiser"];
/** Depth a new member starts from: far enough to be a dot. */
export const ENTER_Z = 3600;
/** Slot anchors in world units: a loose V ahead of the ship at three depths. */
const ANCHORS: Vec3[] = [
  { x: -420, y: -60, z: 1000 },
  { x: 0, y: -120, z: 1400 },
  { x: 440, y: -40, z: 1100 },
];
const WOBBLE_X = 25;
const WOBBLE_Y = 40;

/**
 * Pure squadron state: which enemies exist, where they are in world space, and when empty slots
 * refill. No Pixi here; SquadronView projects members into sprites.
 */
export class SquadronModel {
  readonly members: Member[] = [];
  private readonly slotCount: number;
  private readonly respawnDelayMs: number;
  private readonly enterMs: number;
  private readonly fastEnterMs: number;
  private readonly view: View;
  private readonly random: () => number;
  private readonly respawnAt = new Map<number, number>();
  private nextId = 1;
  private sizeIndex = 0;
  private clock = 0;

  constructor(opts: SquadronOptions = {}) {
    this.slotCount = opts.slots ?? 3;
    this.respawnDelayMs = opts.respawnDelayMs ?? 600;
    this.enterMs = opts.enterMs ?? 1200;
    this.fastEnterMs = opts.fastEnterMs ?? 400;
    this.view = opts.view ?? DEFAULT_VIEW;
    this.random = opts.random ?? Math.random;
    for (let slot = 0; slot < this.slotCount; slot += 1) this.spawn(slot);
  }

  anchor(slot: number): Vec3 {
    const a = ANCHORS[slot % ANCHORS.length];
    return { x: a.x, y: a.y, z: a.z };
  }

  /** Precondition: callers spawn only after a removal; spawning into an occupied slot is not guarded. */
  spawn(slot: number, opts: { fast?: boolean } = {}): Member {
    const a = this.anchor(slot);
    const member: Member = {
      id: this.nextId++,
      slot,
      size: SIZES[this.sizeIndex++ % SIZES.length],
      state: "entering",
      x: a.x,
      y: a.y,
      z: ENTER_Z,
      enterMs: opts.fast ? this.fastEnterMs : this.enterMs,
      elapsed: 0,
      seed: this.random() * Math.PI * 2,
    };
    this.members.push(member);
    this.respawnAt.delete(slot);
    return member;
  }

  update(dtMs: number): void {
    this.clock += dtMs;
    for (const m of this.members) {
      m.elapsed += dtMs;
      const a = this.anchor(m.slot);
      if (m.state === "entering") {
        const t = Math.min(1, m.elapsed / m.enterMs);
        const eased = 1 - (1 - t) * (1 - t);
        m.x = a.x;
        m.y = a.y;
        m.z = ENTER_Z + (a.z - ENTER_Z) * eased;
        if (t >= 1) m.state = "holding";
      } else {
        m.x = a.x + Math.sin(this.clock / 1100 + m.seed) * WOBBLE_X;
        m.y = a.y + Math.sin(this.clock / 700 + m.seed) * WOBBLE_Y;
        m.z = a.z;
      }
    }
    for (const [slot, at] of [...this.respawnAt]) {
      if (this.clock >= at) this.spawn(slot);
    }
  }

  /** Removes and returns the member whose projection is closest to a screen point. */
  takeNearest(sx: number, sy: number): Member | null {
    if (this.members.length === 0) return null;
    let best = this.members[0];
    let bestD = Infinity;
    for (const m of this.members) {
      const p = project(m, this.view);
      const d = (p.sx - sx) ** 2 + (p.sy - sy) ** 2;
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    this.remove(best);
    return best;
  }

  takeAny(): Member | null {
    const m = this.members.find((x) => x.state === "holding") ?? this.members[0];
    if (!m) return null;
    this.remove(m);
    return m;
  }

  pick(): Member | null {
    return this.members.find((m) => m.state === "holding") ?? this.members[0] ?? null;
  }

  /** First slot with no member; callers spawn only after a removal (falls back to 0 when all are full). */
  freeSlot(): number {
    for (let slot = 0; slot < this.slotCount; slot += 1) {
      if (!this.members.some((m) => m.slot === slot)) return slot;
    }
    return 0;
  }

  private remove(member: Member): void {
    const idx = this.members.indexOf(member);
    if (idx >= 0) this.members.splice(idx, 1);
    this.respawnAt.set(member.slot, this.clock + this.respawnDelayMs);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/features/gameplay/renderer/squadron.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Rewrite `spriteUtils.ts`**

```ts
import { Sprite, type Texture } from "pixi.js";
import type { EnemySize } from "@/features/gameplay/engine/types";
import type { SpriteKey } from "./spriteManifest";

/** Generated art is stored at 2x; these are the base scales at depth FOCAL (projection scale 1). */
export const SHIP_SCALE = 0.5;
export const PLANET_SCALE = 0.5;
export const ENEMY_SCALE: Record<EnemySize, number> = { scout: 0.32, fighter: 0.42, cruiser: 0.55 };
export const ENEMY_TEXTURE: Record<EnemySize, SpriteKey> = { scout: "enemyScout", fighter: "enemyFighter", cruiser: "enemyCruiser" };

/** Centred sprite, stored orientation. */
export function sprite(tex: Texture, scale = 1): Sprite {
  const s = new Sprite(tex);
  s.anchor.set(0.5);
  s.scale.set(scale);
  return s;
}

/** Rotates an up-pointing sprite (bolt) so it points from `from` toward `to` on screen. */
export function aimAlong(s: Sprite, from: { x: number; y: number }, to: { x: number; y: number }): void {
  s.rotation = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI / 2;
}
```

- [ ] **Step 6: Rewrite `squadronView.ts`**

```ts
import type { Container, Sprite } from "pixi.js";
import type { SpriteTextures } from "./assets";
import { DEFAULT_VIEW, project, zIndexFor, type View } from "./projection";
import type { SquadronModel } from "./squadron";
import { ENEMY_SCALE, ENEMY_TEXTURE, sprite } from "./spriteUtils";

export type ScreenSpot = { x: number; y: number; scale: number };

/** Reconciles SquadronModel members to projected sprites once per frame. */
export class SquadronView {
  private readonly model: SquadronModel;
  private readonly layer: Container;
  private readonly tex: SpriteTextures;
  private readonly view: View;
  private readonly sprites = new Map<number, Sprite>();

  constructor(model: SquadronModel, layer: Container, tex: SpriteTextures, view: View = DEFAULT_VIEW) {
    this.model = model;
    this.layer = layer;
    this.tex = tex;
    this.view = view;
  }

  sync(): void {
    const live = new Set<number>();
    for (const m of this.model.members) {
      live.add(m.id);
      let s = this.sprites.get(m.id);
      if (!s) {
        s = sprite(this.tex[ENEMY_TEXTURE[m.size]]);
        this.layer.addChild(s);
        this.sprites.set(m.id, s);
      }
      const p = project(m, this.view);
      s.position.set(p.sx, p.sy);
      s.scale.set(ENEMY_SCALE[m.size] * p.scale);
      s.zIndex = zIndexFor(m.z);
    }
    for (const [id, s] of this.sprites) {
      if (!live.has(id)) {
        s.destroy();
        this.sprites.delete(id);
      }
    }
  }

  /** Hands the sprite to an animation, which now owns and must destroy it. */
  detach(id: number): Sprite | undefined {
    const s = this.sprites.get(id);
    if (s) this.sprites.delete(id);
    return s;
  }

  positionOf(id: number): ScreenSpot | undefined {
    const s = this.sprites.get(id);
    return s ? { x: s.x, y: s.y, scale: s.scale.x } : undefined;
  }

  destroy(): void {
    for (const s of this.sprites.values()) s.destroy();
    this.sprites.clear();
  }
}
```

- [ ] **Step 7: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: errors only in `world.ts` and `animations.ts` (they still use `FACE_RIGHT`, the old `SquadronModel` options and the old `sprite` rotation argument). Those files are rewritten in Tasks 8 and 9. Note the error count; it must drop to zero by the end of Task 9.

- [ ] **Step 8: Commit (if authorized)**

```bash
git add src/features/gameplay/renderer/squadron.ts src/features/gameplay/renderer/squadron.test.ts src/features/gameplay/renderer/squadronView.ts src/features/gameplay/renderer/spriteUtils.ts
git commit -m "feat(renderer): squadron slots in depth, projected enemy sprites, stored-orientation sprites"
```

---

### Task 7: Reticle

**Files:**
- Create: `src/features/gameplay/renderer/reticle.ts`

**Interfaces:**
- Consumes: `RETICLE_HOME` from Task 4, `tween`, `easeOut` from `tween.ts`.
- Produces: `class Reticle { constructor(layer: Container, ticker: Ticker); aimAt(x: number, y: number, ms?: number): Promise<void>; release(ms?: number): Promise<void>; flash(color: number, ms?: number): void; destroy(): void }`.

- [ ] **Step 1: Write `reticle.ts`**

```ts
import { Container, Graphics, type Ticker } from "pixi.js";
import { RETICLE_HOME } from "./projection";
import { easeOut, tween } from "./tween";

const COLOR = 0x9be7ff;
const IDLE_ALPHA = 0.55;

function crosshair(color: number, gap: number): Graphics {
  const g = new Graphics();
  g.circle(0, 0, 14).stroke({ width: 1.5, color, alpha: 0.9 });
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    g.moveTo(dx * gap, dy * gap).lineTo(dx * (gap + 8), dy * (gap + 8)).stroke({ width: 2, color });
  }
  g.circle(0, 0, 1.5).fill(color);
  return g;
}

/** Screen-space crosshair that snaps to a target before a shot and drifts home afterwards. */
export class Reticle {
  readonly root = new Container();
  private readonly ticker: Ticker;
  private readonly body: Graphics;

  constructor(layer: Container, ticker: Ticker) {
    this.ticker = ticker;
    this.body = crosshair(COLOR, 18);
    this.root.addChild(this.body);
    this.root.position.set(RETICLE_HOME.x, RETICLE_HOME.y);
    this.root.alpha = IDLE_ALPHA;
    layer.addChild(this.root);
  }

  aimAt(x: number, y: number, ms = 180): Promise<void> {
    const sx = this.root.x;
    const sy = this.root.y;
    return tween(this.ticker, ms, (t) => {
      const e = easeOut(t);
      this.root.position.set(sx + (x - sx) * e, sy + (y - sy) * e);
      this.root.scale.set(1 - 0.3 * e);
      this.root.alpha = IDLE_ALPHA + (1 - IDLE_ALPHA) * e;
    });
  }

  release(ms = 400): Promise<void> {
    const sx = this.root.x;
    const sy = this.root.y;
    const s0 = this.root.scale.x;
    return tween(this.ticker, ms, (t) => {
      const e = easeOut(t);
      this.root.position.set(sx + (RETICLE_HOME.x - sx) * e, sy + (RETICLE_HOME.y - sy) * e);
      this.root.scale.set(s0 + (1 - s0) * e);
      this.root.alpha = 1 - (1 - IDLE_ALPHA) * e;
    });
  }

  /** Coloured copy that pops and fades; never awaited. */
  flash(color: number, ms = 500): void {
    const ghost = crosshair(color, 18);
    ghost.position.copyFrom(this.root.position);
    this.root.parent.addChild(ghost);
    void tween(this.ticker, ms, (t) => {
      ghost.scale.set(1 + t * 1.5);
      ghost.alpha = 1 - t;
    }).then(() => ghost.destroy());
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no new errors from `reticle.ts` (the Task 6 errors in `world.ts`/`animations.ts` remain).

- [ ] **Step 3: Commit (if authorized)**

```bash
git add src/features/gameplay/renderer/reticle.ts
git commit -m "feat(renderer): aiming reticle"
```

---

### Task 8: World and idle loop in the chase view

**Files:**
- Rewrite: `src/features/gameplay/renderer/world.ts`
- Modify: `src/features/gameplay/renderer/ScenarioRenderer.ts`
- Modify: `src/features/gameplay/renderer/callout.ts`
- Modify: `src/features/gameplay/renderer/fx.ts` (shake targets `world.root`'s parent, unchanged in code: stage; verify only)

**Interfaces:**
- Consumes: everything from Tasks 4 to 7.
- Produces the new `World`:

```ts
export type World = {
  app: Application;
  view: View;                 // DEFAULT_VIEW
  width: number;              // DESIGN.width
  height: number;             // DESIGN.height
  tex: SpriteTextures;
  explosionFrames: Texture[];
  quality: Quality;
  root: Container;            // cover-fitted design frame; every layer is its child
  backdrop: Backdrop;
  planet: Sprite;
  depth: Container;           // sortableChildren: stars, rocks, enemies, bolts, bursts
  shipLayer: Container;
  effects: Container;         // screen space: reticle, rings, callouts, bolt trails near the ship
  overlay: Container;
  ship: Container;            // outer rig: position, stall roll, hit lurch
  hull: Container;            // inner: bank + bob; holds body, damage, engines, shield
  shipBody: Sprite;
  damage: [Sprite, Sprite, Sprite];
  engines: [Sprite, Sprite];
  shieldRing: Sprite;
  shieldAlpha: number;
  bank: number;               // current bank angle, eased toward the target each frame
  vignette: Container;
  vignetteTarget: number;
  starfield: StarfieldModel;
  starfieldView: StarfieldView;
  rocks: Rock[];              // { g: Sprite; p: Vec3; spin: number; speed: number }
  squadron: SquadronModel;
  squadronView: SquadronView;
  reticle: Reticle;
};
```

  plus `buildWorld(app, tex, quality): World`, `applyFit(world): void` (reads `app.screen`), `laser(world, kind): Sprite` (added to `depth`), `dot(world, radius, color, layer?: Container): Graphics`, `respawnRock(world, rock): void`, `COLORS`, `ENGINE_OFFSETS`, `ROCK_Z_NEAR = 80`, `ROCK_Z_FAR = 4200`.

- [ ] **Step 1: Rewrite `world.ts`**

```ts
import { Application, Container, FillGradient, Graphics, Rectangle, Texture, type Sprite } from "pixi.js";
import type { SpriteTextures } from "./assets";
import { buildBackdrop, type Backdrop } from "./backdrop";
import { makeBloom, makeGlow } from "./fx";
import { stripFrames } from "./fxMath";
import { DEFAULT_VIEW, DESIGN, fitStage, project, SHIP_SCREEN, zIndexFor, type Vec3, type View } from "./projection";
import type { Quality } from "./quality";
import { Reticle } from "./reticle";
import { EXPLOSION_FRAMES, type SpriteKey } from "./spriteManifest";
import { PLANET_SCALE, SHIP_SCALE, sprite } from "./spriteUtils";
import { StarfieldModel } from "./starfield";
import { StarfieldView } from "./starfieldView";
import { SquadronModel } from "./squadron";
import { SquadronView } from "./squadronView";

export { ENEMY_SCALE, ENEMY_TEXTURE, SHIP_SCALE, sprite } from "./spriteUtils";

export type Rock = { g: Sprite; p: Vec3; spin: number; speed: number };

export type World = {
  app: Application;
  view: View;
  width: number;
  height: number;
  tex: SpriteTextures;
  /** Explosion strip cut into frames, flash first. */
  explosionFrames: Texture[];
  quality: Quality;
  root: Container;
  backdrop: Backdrop;
  planet: Sprite;
  depth: Container;
  shipLayer: Container;
  effects: Container;
  overlay: Container;
  ship: Container;
  hull: Container;
  shipBody: Sprite;
  damage: [Sprite, Sprite, Sprite];
  engines: [Sprite, Sprite];
  shieldRing: Sprite;
  /** Live shield alpha (shield / SHIELD_MAX), set by syncState; animations read it instead of caching. */
  shieldAlpha: number;
  bank: number;
  /** Full-screen red vignette; its alpha is driven toward vignetteTarget. */
  vignette: Container;
  vignetteTarget: number;
  starfield: StarfieldModel;
  starfieldView: StarfieldView;
  rocks: Rock[];
  squadron: SquadronModel;
  squadronView: SquadronView;
  reticle: Reticle;
};

export const COLORS = {
  star: 0xffffff,
  ember: 0xf97316,
  gold: 0xfbbf24,
  ship: 0x38bdf8,
  flash: 0xffffff,
};

/** Engine nozzle positions relative to the ship rig, in design px. Tune once the generated ship is in. */
export const ENGINE_OFFSETS: [{ x: number; y: number }, { x: number; y: number }] = [
  { x: -30, y: 26 },
  { x: 30, y: 26 },
];
export const ENGINE_SCALE = 0.55;
export const ROCK_Z_NEAR = 80;
export const ROCK_Z_FAR = 4200;
const ROCK_COUNT = 10;
const ROCK_UNITS_PER_MS = 1.1;
const METEOR_KEYS: SpriteKey[] = ["meteorBig1", "meteorBig2", "meteorBig3", "meteorBig4", "meteorMed1", "meteorMed2"];

function makeShip(tex: SpriteTextures) {
  const ship = new Container();
  const hull = new Container();
  const engines = ENGINE_OFFSETS.map((o) => {
    // The flame texture points up; squashed and additive it reads as a nozzle glow facing the camera.
    const e = sprite(tex.flame, ENGINE_SCALE);
    e.scale.set(ENGINE_SCALE * 1.4, ENGINE_SCALE * 0.6);
    e.position.set(o.x, o.y);
    e.blendMode = "add";
    return e;
  }) as [Sprite, Sprite];
  const body = sprite(tex.ship, SHIP_SCALE);
  const damage = ([1, 2, 3] as const).map((i) => {
    const d = sprite(tex[`shipDamage${i}`], SHIP_SCALE);
    d.alpha = 0;
    return d;
  }) as [Sprite, Sprite, Sprite];
  const shieldRing = sprite(tex.shield, SHIP_SCALE * 2.2);
  shieldRing.alpha = 0;
  shieldRing.blendMode = "add";
  hull.addChild(...engines, body, ...damage, shieldRing);
  ship.addChild(hull);
  return { ship, hull, body, damage, engines, shieldRing };
}

export function respawnRock(world: World, rock: Rock, z = ROCK_Z_FAR * (0.8 + Math.random() * 0.2)): void {
  // Off the centre line in world units so a rock never crosses the ship or the targets.
  const side = Math.random() < 0.5 ? -1 : 1;
  const vertical = Math.random() < 0.35;
  rock.p = vertical
    ? { x: (Math.random() * 2 - 1) * 1400, y: side * (320 + Math.random() * 500), z }
    : { x: side * (420 + Math.random() * 900), y: (Math.random() * 2 - 1) * 700, z };
  rock.speed = 0.85 + Math.random() * 0.3;
  rock.g.rotation = Math.random() * Math.PI * 2;
}

function makeRocks(world: World): Rock[] {
  return Array.from({ length: ROCK_COUNT }, () => {
    const key = METEOR_KEYS[Math.floor(Math.random() * METEOR_KEYS.length)];
    const g = sprite(world.tex[key]);
    g.alpha = 0.95;
    world.depth.addChild(g);
    const rock: Rock = { g, p: { x: 0, y: 0, z: ROCK_Z_FAR }, spin: (Math.random() - 0.5) * 0.02, speed: 1 };
    respawnRock(world, rock, ROCK_Z_NEAR + Math.random() * (ROCK_Z_FAR - ROCK_Z_NEAR));
    return rock;
  });
}

/** Projects a rock and advances it; respawns past the near plane or outside the frame. */
export function updateRock(world: World, rock: Rock, dtMs: number, warp: number): void {
  rock.p.z -= ROCK_UNITS_PER_MS * warp * rock.speed * dtMs;
  const p = project(rock.p, world.view);
  const m = 160;
  if (rock.p.z < ROCK_Z_NEAR || p.sx < -m || p.sx > world.width + m || p.sy < -m || p.sy > world.height + m) {
    respawnRock(world, rock);
    return;
  }
  rock.g.position.set(p.sx, p.sy);
  rock.g.scale.set(1.6 * p.scale);
  rock.g.rotation += rock.spin * dtMs * 0.06;
  rock.g.zIndex = zIndexFor(rock.p.z);
}

/** Scales and centres the design frame to cover the host. Call at build and on every resize. */
export function applyFit(world: World): void {
  const fit = fitStage(world.app.screen.width, world.app.screen.height);
  world.root.scale.set(fit.scale);
  world.root.position.set(fit.x, fit.y);
}

export function buildWorld(app: Application, tex: SpriteTextures, quality: Quality): World {
  const view = DEFAULT_VIEW;
  const width = DESIGN.width;
  const height = DESIGN.height;

  const root = new Container();
  const backdropLayer = new Container();
  const planetLayer = new Container();
  const depth = new Container();
  depth.sortableChildren = true;
  const shipLayer = new Container();
  const effects = new Container();
  const overlay = new Container();
  root.addChild(backdropLayer, planetLayer, depth, shipLayer, effects, overlay);
  app.stage.addChild(root);

  const strip = tex.explosion;
  const explosionFrames = stripFrames(strip.width, strip.height, EXPLOSION_FRAMES).map(
    (f) => new Texture({ source: strip.source, frame: new Rectangle(f.x, f.y, f.width, f.height) }),
  );

  const backdrop = buildBackdrop(tex.bgGalaxy, width, height);
  backdropLayer.addChild(backdrop.sprite);

  const planet = sprite(tex.planet, PLANET_SCALE);
  planet.position.set(view.vp.x + 250, view.vp.y - 40);
  planet.alpha = 0.95;
  planetLayer.addChild(planet);

  const { ship, hull, body, damage, engines, shieldRing } = makeShip(tex);
  if (quality === "high") {
    depth.filters = [makeBloom()];
    shieldRing.filters = [makeGlow()];
  }
  ship.position.set(SHIP_SCREEN.x, SHIP_SCREEN.y);
  shipLayer.addChild(ship);

  const starfield = new StarfieldModel({ view });
  const starfieldView = new StarfieldView(starfield, depth, view);

  const squadron = new SquadronModel({ view });
  const squadronView = new SquadronView(squadron, depth, tex, view);
  squadronView.sync();

  const reticle = new Reticle(effects, app.ticker);

  // Edge vignette: four linear-gradient bands (red at the frame edge, transparent inward) so
  // the centre stays clear. Radial FillGradients rendered a solid wash here. Alpha is animated
  // on the container elsewhere; starts hidden.
  const vignette = new Container();
  const band = (x: number, y: number, w: number, h: number, vertical: boolean, edgeFirst: boolean): Graphics => {
    const edge = "rgba(255,45,45,1)";
    const clear = "rgba(255,45,45,0)";
    const fill = new FillGradient({
      type: "linear",
      start: { x: 0, y: 0 },
      end: vertical ? { x: 0, y: 1 } : { x: 1, y: 0 },
      colorStops: [
        { offset: 0, color: edgeFirst ? edge : clear },
        { offset: 1, color: edgeFirst ? clear : edge },
      ],
      textureSpace: "local",
    });
    return new Graphics().rect(x, y, w, h).fill(fill);
  };
  const bandH = height * 0.28;
  const bandW = width * 0.28;
  vignette.addChild(
    band(0, 0, width, bandH, true, true),
    band(0, height - bandH, width, bandH, true, false),
    band(0, 0, bandW, height, false, true),
    band(width - bandW, 0, bandW, height, false, false),
  );
  vignette.alpha = 0;
  overlay.addChild(vignette);

  const world: World = {
    app, view, width, height, tex, explosionFrames, quality, root, backdrop, planet, depth, shipLayer, effects, overlay,
    ship, hull, shipBody: body, damage, engines, shieldRing, shieldAlpha: 0, bank: 0, vignette, vignetteTarget: 0,
    starfield, starfieldView, rocks: [], squadron, squadronView, reticle,
  };
  world.rocks = makeRocks(world);
  applyFit(world);
  return world;
}

export type LaserKind = "mine" | "charged" | "theirs";

/** A bolt in the depth layer; callers set position, scale, rotation and zIndex every frame. */
export function laser(world: World, kind: LaserKind): Sprite {
  const key: SpriteKey = kind === "mine" ? "laserMine" : kind === "charged" ? "laserCharged" : "laserTheirs";
  const s = sprite(world.tex[key]);
  s.blendMode = "add";
  world.depth.addChild(s);
  return s;
}

export function dot(world: World, radius: number, color: number, layer: Container = world.depth): Graphics {
  const g = new Graphics().circle(0, 0, radius).fill(color);
  g.blendMode = "add";
  layer.addChild(g);
  return g;
}
```

- [ ] **Step 2: Update `ScenarioRenderer.ts`**

Replace the imports and the `idle` callback, and add the resize hook in `mount` and its removal in `destroy`:

```ts
import { Application, type Ticker } from "pixi.js";
import { HULL_MAX, SHIELD_MAX } from "@/features/gameplay/engine/mapping";
import type { ScenarioState, ShipAction } from "@/features/gameplay/engine/types";
import { ActionQueue } from "./ActionQueue";
import { runAnimation } from "./animations";
import { loadSprites, type SpriteTextures } from "./assets";
import { project } from "./projection";
import { detectQuality } from "./quality";
import type { RendererPort } from "./RendererPort";
import { applyFit, buildWorld, ENGINE_SCALE, updateRock, type World } from "./world";

const MAX_BANK = 0.12;
const BOB_PX = 4;
```

In `mount`, after `const world = buildWorld(app, tex, detectQuality());`:

```ts
    this.onResize = () => applyFit(world);
    app.renderer.on("resize", this.onResize);
```

Add the field `private onResize: (() => void) | null = null;` and in `destroy`, before `app.destroy`: `if (this.onResize) this.app.renderer.off("resize", this.onResize);`.

New idle loop:

```ts
  private idle = (ticker: Ticker): void => {
    const world = this.world;
    if (!world) return;
    const dt = ticker.deltaTime;
    const dtMs = ticker.deltaMS;
    const now = performance.now();
    world.backdrop.pan(dt);
    world.planet.x += 0.002 * dt;
    world.starfield.update(dtMs);
    world.starfieldView.draw();
    for (const rock of world.rocks) updateRock(world, rock, dtMs, world.starfield.warp);
    world.squadron.update(dtMs);
    world.squadronView.sync();

    // Bank toward the member a shot would take; bob gently.
    const target = world.squadron.pick();
    const bankTarget = target ? Math.max(-1, Math.min(1, (project(target, world.view).sx - world.width / 2) / (world.width / 2))) * MAX_BANK : 0;
    world.bank += (bankTarget - world.bank) * Math.min(1, 0.08 * dt);
    world.hull.rotation = world.bank;
    world.hull.x = world.bank * 60;
    world.hull.y = Math.sin(now / 900) * BOB_PX;

    world.shieldRing.visible = world.shieldRing.alpha > 0.01;
    for (const e of world.engines) {
      e.scale.set(ENGINE_SCALE * 1.4 * (0.9 + Math.random() * 0.25), ENGINE_SCALE * 0.6 * (0.85 + Math.random() * 0.3));
      e.alpha = 0.8 + Math.random() * 0.2;
    }
    world.vignette.alpha = world.vignetteTarget * (1 + 0.2 * Math.sin((now / 1000) * Math.PI * 2));
  };
```

`destroy()` also calls `this.world?.starfieldView.destroy()` and `this.world?.reticle.destroy()` next to `squadronView.destroy()`.

- [ ] **Step 3: Give `callout.ts` a depth size factor**

```ts
export function callout(world: World, x: number, y: number, text: string, color: number, sizeFactor = 1): void {
  const fontSize = Math.max(11, Math.min(20, Math.round(16 * sizeFactor)));
  // ... style: { ..., fontSize, ... } ; the rest unchanged
```

- [ ] **Step 4: Temporarily stub `animations.ts` so the app type-checks**

Replace the body of `animations.ts` with a stub that resolves every action immediately (Task 9 rewrites it):

```ts
import type { ShipAction } from "@/features/gameplay/engine/types";
import type { World } from "./world";

export function runAnimation(_world: World, _action: ShipAction): Promise<void> {
  return Promise.resolve();
}
```

Run: `npx tsc -p tsconfig.app.json --noEmit` → no errors. Run: `npm test` → all suites pass (engine, feeds, pages, projection, starfield, squadron, manifest, scripts).

- [ ] **Step 5: Look at the idle scene**

```bash
npm run dev    # background, port 5173
agent-browser open http://localhost:5173/sandbox
agent-browser screenshot "C:\Users\Oscar Cordero\projects\zingi\osb-ship-scenario\.superpowers\sdd\screens\chase-idle.png"
```

Check: ship from behind at bottom center with two flickering nozzle glows; three enemies small ahead in a V; stars streaming outward from above the ship; rocks growing as they pass; planet upper right; reticle between ship and horizon; no sprite rotated a quarter turn. Tune `ENGINE_OFFSETS` to the generated ship's nozzles and `ENEMY_SCALE` if the enemies read too small (target 70 to 100 px wide while holding). Resize the window narrower and wider: the frame keeps covering, no black bars.

- [ ] **Step 6: Commit (if authorized)**

```bash
git add src/features/gameplay/renderer
git commit -m "feat(renderer): chase-view world with depth layer, starfield, rocks, planet and resize fit"
```

---

### Task 9: Actions in the chase view

**Files:**
- Rewrite: `src/features/gameplay/renderer/animations.ts`

**Interfaces:**
- Consumes: `World`, `laser`, `dot`, `COLORS` from Task 8; `project`, `lerp3`, `zIndexFor`, `SHIP_WORLD`, `CANNONS`, `toWorld`, `Vec3` from Task 4; `aimAlong`, `SHIP_SCALE` from Task 6; `callout`, `CALLOUT_COLORS`; `shake`, `trail`, `whiteFlash` from `fx.ts`; `frameAt`; `tween`, `easeOut`.
- Produces: `runAnimation(world, action): Promise<void>` with the same switch as before.

- [ ] **Step 1: Write the new `animations.ts`**

```ts
import { Graphics, Sprite } from "pixi.js";
import type { EnemySize, ShipAction } from "@/features/gameplay/engine/types";
import { callout, CALLOUT_COLORS } from "./callout";
import { shake, trail, whiteFlash } from "./fx";
import { frameAt } from "./fxMath";
import { CANNONS, lerp3, project, SHIP_WORLD, zIndexFor, type Vec3 } from "./projection";
import { aimAlong } from "./spriteUtils";
import { easeOut, tween } from "./tween";
import { COLORS, dot, laser, type World } from "./world";

const DURATION = {
  fire: 600,
  hit: 500,
  shieldUp: 400,
  fizzle: 400,
  stall: 1000,
  enemyMalfunction: 800,
  objectiveComplete: 1200,
  warpOut: 2000,
  explode: 2000,
} as const;

const BURST_SCALE: Record<EnemySize, number> = { scout: 1, fighter: 1.4, cruiser: 1.9 };
/** Projection scale of the nearest holding slot (z = 1000); burst sizes are tuned relative to it. */
const DEPTH_REF = 0.4;
/** Explosion frame strip on screen = 112 px at scale 1; the fireball reads best a little under that. */
const EXPLOSION_SCALE = 0.85;
const BOLT_SCALE = { mine: 1.6, charged: 2.0, theirs: 1.2 } as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Places a depth-layer sprite at a world point: position, projected scale and sort key. */
function place(world: World, s: Sprite, p: Vec3, baseScale: number): { sx: number; sy: number; scale: number } {
  const pr = project(p, world.view);
  s.position.set(pr.sx, pr.sy);
  s.scale.set(baseScale * pr.scale);
  s.zIndex = zIndexFor(p.z);
  return pr;
}

/** Explosion: frame strip plus a white flash, ember ring and radial particles, scaled for depth. Runs for `ms`. */
async function burst(world: World, x: number, y: number, z: number, scale: number, ms: number) {
  const frames = world.explosionFrames;
  const fire = new Sprite(frames[0]);
  fire.anchor.set(0.5);
  fire.scale.set(EXPLOSION_SCALE * scale);
  fire.rotation = Math.random() * Math.PI * 2;
  // Normal blending: additive plus bloom washed the fireball out to a white disc.
  fire.position.set(x, y);
  fire.zIndex = zIndexFor(z) + 1;
  world.depth.addChild(fire);
  const flash = dot(world, 6 * scale, COLORS.flash);
  flash.position.set(x, y);
  flash.zIndex = fire.zIndex;
  const ring = new Graphics().circle(0, 0, 10 * scale).stroke({ width: 3, color: COLORS.ember });
  ring.blendMode = "add";
  ring.position.set(x, y);
  ring.zIndex = fire.zIndex;
  world.depth.addChild(ring);
  const parts = Array.from({ length: 12 }, (_, i) => {
    const p = dot(world, 2 * scale, i % 2 ? COLORS.ember : COLORS.gold);
    p.position.set(x, y);
    p.zIndex = fire.zIndex;
    const a = (i / 12) * Math.PI * 2;
    return { p, dx: Math.cos(a) * 60 * scale, dy: Math.sin(a) * 60 * scale };
  });
  await tween(world.app.ticker, ms, (t) => {
    fire.texture = frames[frameAt(t, frames.length)];
    flash.scale.set(1 + t * 2.5);
    flash.alpha = Math.max(0, 1 - t * 3);
    ring.scale.set(1 + t * 5);
    ring.alpha = 1 - t;
    for (const { p, dx, dy } of parts) {
      p.x = x + dx * easeOut(t);
      p.y = y + dy * easeOut(t);
      p.alpha = 1 - t;
    }
  });
  fire.destroy();
  flash.destroy();
  ring.destroy();
  for (const { p } of parts) p.destroy();
}

async function fire(world: World, size: EnemySize, charged: boolean, caption?: string) {
  const { app, squadron, squadronView, reticle } = world;
  let member = squadron.takeNearest(reticle.root.x, reticle.root.y);
  if (!member) {
    squadron.spawn(squadron.freeSlot(), { fast: true });
    squadronView.sync();
    member = squadron.takeNearest(reticle.root.x, reticle.root.y)!;
  }
  // Invariant: the model was just synced, so the member's sprite exists.
  const enemy = squadronView.detach(member.id)!;
  const base = enemy.scale.x / project(member, world.view).scale;
  const from: Vec3 = { x: member.x, y: member.y, z: member.z };
  const dest = squadron.anchor(member.slot);
  const kind = charged ? "charged" : "mine";
  const key = charged ? "laserCharged" : "laserMine";
  const shots = CANNONS.map((c) => ({ shot: laser(world, kind), tr: trail(world, key, BOLT_SCALE[kind]), from: c }));
  const aimP = project(from, world.view);
  const aim = reticle.aimAt(aimP.sx, aimP.sy);
  const travel = DURATION.fire * 0.6;
  let target = from;
  await tween(app.ticker, travel, (t) => {
    // A freshly spawned target is still flying in; bring it to its anchor during the shot's flight.
    target = lerp3(from, dest, t);
    const tp = place(world, enemy, target, base);
    for (const { shot, tr, from: c } of shots) {
      const p = lerp3(c, target, easeOut(t));
      const pr = place(world, shot, p, BOLT_SCALE[kind]);
      aimAlong(shot, { x: pr.sx, y: pr.sy }, { x: tp.sx, y: tp.sy });
      tr.update(pr.sx, pr.sy);
    }
  });
  await aim;
  for (const { shot, tr } of shots) {
    shot.destroy();
    tr.destroy();
  }
  whiteFlash(world, enemy);
  shake(world, size === "cruiser" ? 3 : 2, 150);
  const tp = project(target, world.view);
  const depthK = tp.scale / DEPTH_REF;
  if (caption) callout(world, tp.sx, tp.sy - 30 * depthK, caption, charged ? CALLOUT_COLORS.charged : CALLOUT_COLORS.mine, depthK);
  const burstDone = burst(world, tp.sx, tp.sy, target.z, BURST_SCALE[size] * depthK * (charged ? 1.3 : 1), DURATION.fire - travel);
  const s0 = enemy.scale.x;
  await tween(app.ticker, (DURATION.fire - travel) * 0.5, (t) => {
    enemy.scale.set(s0 * (1 + t * 0.6));
    enemy.alpha = 1 - t;
  });
  enemy.destroy();
  void reticle.release();
  await burstDone;
}

async function hit(world: World, points: 1 | 2 | 3, absorbed: boolean, caption?: string) {
  const { app, ship, shipBody, shieldRing, squadron } = world;
  const source = squadron.pick();
  const from: Vec3 = source ? { x: source.x, y: source.y, z: source.z } : { x: (Math.random() - 0.5) * 600, y: -80, z: 1200 };
  const drift = (Math.random() - 0.5) * 120;
  const to: Vec3 = { x: SHIP_WORLD.x + drift * 0.3, y: SHIP_WORLD.y - 20, z: SHIP_WORLD.z + 40 };
  const shot = laser(world, "theirs");
  const scale = BOLT_SCALE.theirs * (0.6 + points * 0.15);
  const tr = trail(world, "laserTheirs", scale);
  const travel = DURATION.hit * 0.6;
  const shipP = project(to, world.view);
  await tween(app.ticker, travel, (t) => {
    const p = lerp3(from, to, t * t);
    p.x += drift * Math.sin(t * Math.PI);
    const pr = place(world, shot, p, scale);
    aimAlong(shot, { x: pr.sx, y: pr.sy }, { x: shipP.sx, y: shipP.sy });
    tr.update(pr.sx, pr.sy);
  });
  shot.destroy();
  tr.destroy();
  if (caption) callout(world, ship.x + 90, ship.y - 70, caption, CALLOUT_COLORS.theirs);
  if (absorbed) {
    const s0 = shieldRing.scale.x;
    await tween(app.ticker, DURATION.hit - travel, (t) => {
      shieldRing.alpha = lerp(1, world.shieldAlpha, t);
      shieldRing.scale.set(s0 * (1 + (1 - t) * 0.2));
    });
    shieldRing.scale.set(s0);
    shieldRing.alpha = world.shieldAlpha;
    return;
  }
  const amplitude = points * 3;
  shake(world, amplitude, 250);
  const overlay = world.damage.find((d) => d.alpha > 0);
  const baseX = ship.x;
  const baseY = ship.y;
  await tween(app.ticker, DURATION.hit - travel, (t) => {
    ship.x = baseX + Math.sin(t * 40) * amplitude * (1 - t);
    ship.y = baseY + Math.sin(t * Math.PI) * amplitude * 1.5;
    shipBody.tint = t < 0.5 ? 0xff6b6b : 0xffffff;
    if (overlay) overlay.tint = shipBody.tint;
  });
  ship.position.set(baseX, baseY);
  shipBody.tint = 0xffffff;
  if (overlay) overlay.tint = 0xffffff;
}

async function shieldUp(world: World, caption?: string) {
  const { app, shieldRing, ship } = world;
  if (caption) callout(world, ship.x, ship.y - 90, caption, CALLOUT_COLORS.mine);
  const s0 = shieldRing.scale.x;
  await tween(app.ticker, DURATION.shieldUp, (t) => {
    const grow = t < 0.5 ? lerp(1, 1.3, t * 2) : lerp(1.3, 1, (t - 0.5) * 2);
    shieldRing.scale.set(s0 * grow);
    // The pulse stays visible even when the state alpha is 0; the live alpha wins once it is higher.
    const pulse = t < 0.5 ? t * 2 : 2 - t * 2;
    shieldRing.alpha = Math.max(world.shieldAlpha, pulse);
  });
  shieldRing.scale.set(s0);
  shieldRing.alpha = world.shieldAlpha;
}

async function fizzle(world: World, caption?: string) {
  const { app, ship } = world;
  if (caption) callout(world, ship.x, ship.y - 150, caption, CALLOUT_COLORS.theirs);
  const shot = laser(world, "mine");
  const from = CANNONS[Math.random() < 0.5 ? 0 : 1];
  const to: Vec3 = { x: from.x * 0.5, y: -40, z: 1600 };
  const toP = project(to, world.view);
  await tween(app.ticker, DURATION.fizzle, (t) => {
    const p = lerp3(from, to, easeOut(t) * 0.7);
    p.x += Math.sin(t * 12) * 20;
    const pr = place(world, shot, p, BOLT_SCALE.mine);
    aimAlong(shot, { x: pr.sx, y: pr.sy }, { x: toP.sx, y: toP.sy });
    shot.alpha = 1 - easeOut(t);
  });
  shot.destroy();
}

async function stall(world: World, caption?: string) {
  const { app, ship } = world;
  if (caption) callout(world, ship.x, ship.y - 90, caption, CALLOUT_COLORS.mine);
  const baseX = ship.x;
  await tween(app.ticker, DURATION.stall, (t) => {
    ship.rotation = Math.PI * 2 * easeOut(t);
    ship.x = baseX - 30 * Math.sin(t * Math.PI);
  });
  ship.rotation = 0;
  ship.x = baseX;
}

async function enemyMalfunction(world: World, caption?: string) {
  const { squadron, squadronView } = world;
  let member = squadron.takeAny();
  if (!member) {
    squadron.spawn(squadron.freeSlot(), { fast: true });
    squadronView.sync();
    member = squadron.takeAny()!;
  }
  // Invariant: the model was just synced, so the member's sprite exists.
  const enemy = squadronView.detach(member.id)!;
  const base = enemy.scale.x / project(member, world.view).scale;
  const startP = project(member, world.view);
  if (caption) callout(world, startP.sx, startP.sy - 30, caption, CALLOUT_COLORS.theirs, startP.scale / DEPTH_REF);
  const from: Vec3 = { x: member.x, y: member.y, z: member.z };
  const side = member.x === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(member.x);
  // Tumble toward and past the camera, drifting outward so it leaves at a frame edge, never through the ship.
  const to: Vec3 = { x: side * 900, y: member.y - 300, z: 120 };
  const startRot = enemy.rotation;
  await tween(world.app.ticker, DURATION.enemyMalfunction, (t) => {
    const e = t * t;
    place(world, enemy, lerp3(from, to, e), base);
    enemy.rotation = startRot + t * 6;
    enemy.alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
  });
  enemy.destroy();
}

async function objectiveComplete(world: World) {
  const ring = new Graphics().circle(0, 0, 20).stroke({ width: 4, color: COLORS.gold });
  ring.position.set(world.ship.x, world.ship.y);
  world.effects.addChild(ring);
  world.reticle.flash(COLORS.gold);
  await tween(world.app.ticker, DURATION.objectiveComplete, (t) => {
    ring.scale.set(1 + t * 8);
    ring.alpha = 1 - t;
  });
  ring.destroy();
}

async function warpOut(world: World) {
  const { app, ship, starfield, view } = world;
  const x0 = ship.x;
  const y0 = ship.y;
  await tween(app.ticker, DURATION.warpOut, (t) => {
    starfield.warp = 1 + 9 * easeOut(t);
    const e = t * t;
    ship.x = lerp(x0, view.vp.x, e);
    ship.y = lerp(y0, view.vp.y, e);
    ship.scale.set(1 - 0.95 * e);
    ship.alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
  });
}

async function explode(world: World) {
  const { app, ship } = world;
  shake(world, 8, 600);
  const big = burst(world, ship.x, ship.y, SHIP_WORLD.z, 3, DURATION.explode * 0.6);
  await tween(app.ticker, DURATION.explode, (t) => {
    ship.alpha = 1 - t;
    ship.scale.set(1 + t);
  });
  await big;
}

export function runAnimation(world: World, action: ShipAction): Promise<void> {
  switch (action.type) {
    case "fire":
      return fire(world, action.size, action.charged, action.caption);
    case "hit":
      return hit(world, action.points, action.absorbed, action.caption);
    case "shieldUp":
      return shieldUp(world, action.caption);
    case "fizzle":
      return fizzle(world, action.caption);
    case "stall":
      return stall(world, action.caption);
    case "enemyMalfunction":
      return enemyMalfunction(world, action.caption);
    case "objectiveComplete":
      return objectiveComplete(world);
    case "warpOut":
      return warpOut(world);
    case "explode":
      return explode(world);
  }
}
```

Notes for the implementer: `noUnusedLocals` fails the build, so every import above must stay used if you adjust the code. `trail()` ghosts keep a fixed scale; that is acceptable since trails only run at high quality and sit behind the bolt. The explosion burst in `explode` is drawn in the depth layer at the ship's depth, which sorts above every enemy (z 1000+) as intended.

- [ ] **Step 2: Type-check, lint, test**

Run: `npx tsc -p tsconfig.app.json --noEmit` → no errors.
Run: `npm run lint` → clean.
Run: `npm test` → all pass (expected 97 existing + 7 gemini + 9 projection + 5 starfield, minus nothing; squadron count unchanged at 9; so about 118).

- [ ] **Step 3: Record every action in the sandbox**

```bash
agent-browser record start "C:\Users\Oscar Cordero\projects\zingi\osb-ship-scenario\.superpowers\sdd\screens\chase-actions.webm" http://localhost:5173/sandbox
# click: Fire scout, Fire cruiser charged, Hit 3, Shield up, Hit 2 (absorbed, after setting shield 1), Fizzle, Stall, Enemy malfunction, Objective, Warp out
agent-browser record stop
ffmpeg -i chase-actions.webm -vf fps=10 "...\screens\chase-%03d.png"
```

Check each: bolts leave both wing cannons, converge and shrink; reticle snaps to the target then returns; enemy bolt grows toward the ship with the shield flare on absorb; barrel roll; malfunctioning enemy grows past the ship and exits at an edge; warp streaks and the ship shrinking into the vanishing point; explode burst centered on the ship. Then run a full replay on `/game-play` at the default speed and watch for anything stuck (the result overlay must still appear at Final).

- [ ] **Step 4: Low-quality pass**

Open `http://localhost:5173/sandbox?quality=low`, fire a few actions: no bloom, no trails, still readable, no errors in the console.

- [ ] **Step 5: Commit (if authorized)**

```bash
git add src/features/gameplay/renderer/animations.ts
git commit -m "feat(renderer): every ship action travels along the depth axis"
```

---

### Task 10: Docs, ledger and final review

**Files:**
- Modify: `CLAUDE.md` (renderer paragraph), `README.md` (renderer and art pipeline notes)
- Modify: `.superpowers/sdd/progress.md` (ledger; ignored by git)

- [ ] **Step 1: Update `CLAUDE.md`**

Replace the renderer bullet's layer and sprite sentences with:

> The scene is a behind-the-ship chase view. `renderer/projection.ts` (pure) maps world points `{x, y, z}` to screen through a vanishing point (`DEFAULT_VIEW`, design frame 1280 x 720, `fitStage` covers the host). Everything with depth (stars from `starfield.ts`, rocks, squadron members, bolts, bursts) lives in `world.depth`, a sortable container whose zIndex is `zIndexFor(z)`. The player ship is a fixed screen sprite at `SHIP_SCREEN`; `world.ship` is the rig (position, roll), `world.hull` banks and bobs. Sprite art under `public/sprites/` is stored exactly as drawn (rear-view ship, head-on enemies; see `CREDITS.md`), generated with `npm run gen-art` (Gemini, prompts in `scripts/geminiImage.ts`) and keyed with `scripts/key-art.py`. Layer order, back to front: backdrop, planet, depth, shipLayer, effects (reticle, rings, callouts), overlay (vignette).

- [ ] **Step 2: Update `README.md`**

Add an "Art pipeline" section:

```markdown
## Art pipeline

Set `GEMINI_API_KEY` (AI Studio key). Then:

```bash
npm run gen-art -- ship --n 3                 # raw candidates in .superpowers/art/raw/
npm run gen-art -- --all --model gemini-3-pro-image
python scripts/key-art.py .superpowers/art/raw/ship-1.png public/sprites/ship.png --width 520
```

Prompts live in `scripts/geminiImage.ts`; the keyer removes the black background, trims and downscales.
```

- [ ] **Step 3: Ledger and full verification**

Append to `.superpowers/sdd/progress.md`: date, branch, what shipped, tuned constants (`ENGINE_OFFSETS`, `ENEMY_SCALE`, planet position), which damage states were edits vs procedural, and deferred items (HUD restyle, capital ship, trail ghosts at fixed scale, planet parallax if skipped).

Run the full gate and paste the output in the ledger:

```bash
npx tsc -b && npm run lint && npm test && npm run build
```

Expected: zero type errors, lint clean, all tests pass, `dist/` built.

- [ ] **Step 4: Commit (if authorized) and hand over**

```bash
git add CLAUDE.md README.md
git commit -m "docs: chase camera renderer notes and art pipeline"
```

Then request a whole-branch review (superpowers:requesting-code-review) and, after fixes, use superpowers:finishing-a-development-branch. Merging to master and deploying (`vercel deploy --prod --yes`) are Oscar's calls.
