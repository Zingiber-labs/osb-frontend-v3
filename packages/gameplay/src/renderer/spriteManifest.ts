export const SPRITE_BASE = "/sprites";

/**
 * Sprites are stored exactly as drawn on screen (chase view: the player ship from behind, enemies
 * head-on). The ship, damage states, enemies and planet are stored at 2x and drawn at about 0.5.
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
  enemyScout: "enemy_scout.png",
  enemyFighter: "enemy_fighter.png",
  enemyCruiser: "enemy_cruiser.png",
  laserMine: "laser_mine.png",
  laserCharged: "laser_charged.png",
  laserTheirs: "laser_theirs.png",
  meteorBig1: "meteor_big1.png",
  meteorBig2: "meteor_big2.png",
  meteorBig3: "meteor_big3.png",
  meteorBig4: "meteor_big4.png",
  meteorMed1: "meteor_med1.png",
  meteorMed2: "meteor_med2.png",
  /** Horizontal strip of EXPLOSION_FRAMES square frames, bright flash first, smoke last. */
  explosion: "explosion_strip.png",
} as const;

export const EXPLOSION_FRAMES = 8;

export type SpriteKey = keyof typeof SPRITE_FILES;
