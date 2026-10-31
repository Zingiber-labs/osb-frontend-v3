import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ART_PROMPTS, buildImageRequest, extractPng, resolveApiKey, type ArtAsset } from "./geminiImage";

const RAW_DIR = ".superpowers/art/raw";
const DEFAULT_MODEL = "gemini-3.1-flash-image";

function readUserEnv(name: string): string | undefined {
  if (process.platform !== "win32") return undefined;
  try {
    const out = execFileSync("reg", ["query", "HKCU\Environment", "/v", name], { encoding: "utf8" });
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
