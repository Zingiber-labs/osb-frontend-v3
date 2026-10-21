export const SPRITE_BASE = "/sprites";

export const SPRITE_FILES = {
  ship: "playerShip1_blue.png",
  shipDamage1: "playerShip1_damage1.png",
  shipDamage2: "playerShip1_damage2.png",
  shipDamage3: "playerShip1_damage3.png",
  flame: "fire08.png",
  bgGalaxy: "bg/galaxy.jpg",
  shield: "shield1.png",
  enemyScout: "enemyRed1.png",
  enemyFighter: "enemyRed3.png",
  enemyCruiser: "enemyRed5.png",
  laserMine: "laserBlue01.png",
  laserCharged: "laserBlue08.png",
  laserTheirs: "laserRed01.png",
  meteorBig1: "meteorGrey_big1.png",
  meteorBig2: "meteorGrey_big2.png",
  meteorBig3: "meteorGrey_big3.png",
  meteorBig4: "meteorGrey_big4.png",
  meteorMed1: "meteorGrey_med1.png",
  meteorMed2: "meteorGrey_med2.png",
} as const;

export type SpriteKey = keyof typeof SPRITE_FILES;
