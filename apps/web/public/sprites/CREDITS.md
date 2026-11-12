# Sprite credits

- `ship.png`, `ship_damage1..3.png`, `enemy_scout.png`, `enemy_fighter.png`, `enemy_cruiser.png` and
  `planet.png` were generated for this project on 2026-10-30 with Google Gemini's image model
  (Nano Banana) through the Gemini web app, from the prompts in `scripts/geminiImage.ts` (the API
  route in `scripts/gen-art.ts` needs a billed key; the free tier has no image quota). The full-size
  2048 px downloads were keyed, trimmed and downscaled with `scripts/key-art.py`; the four ship files
  share one crop (`--bbox-from`) so the damage states overlay the clean ship exactly. The damage
  states are image-to-image edits of the clean ship made in the same chat.
- `flame.png` (engine glow) is drawn procedurally (soft additive gradient), no third-party source.
- `bg/galaxy.jpg` is Outer Sports Ballers' own galaxy backdrop, downscaled.
- Lasers, shield, meteors and the explosion strip were generated with Canva's image generator on
  2026-10-21 (sheets in the Canva design "Blank black square canvas", DAHYraDWo9E).

Orientation convention: files are stored exactly as they appear on screen. The player ship is seen
from behind, enemies head-on; bolts point up in the file and are rotated along their travel.
