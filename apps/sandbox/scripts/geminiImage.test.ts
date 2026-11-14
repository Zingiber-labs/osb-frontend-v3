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
