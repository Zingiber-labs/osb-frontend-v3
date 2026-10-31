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
