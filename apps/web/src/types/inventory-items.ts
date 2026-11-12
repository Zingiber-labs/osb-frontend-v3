export interface MyInventory {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  acquiredAt: string;
  expiresAt: any;
  equipped: boolean;
  attributes: any;
  item: Item;
}

export interface Item {
  id: string;
  itemCode: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  iconUrl: string;
  stackable: boolean;
  tradeable: boolean;
  createdAt: string;
  updatedAt: string;
  purchaseLimit: number;
  purchaseLimitType: string;
  isPackage: boolean;
  price: number;
  category: string;
  featured: boolean;
  displayOrder: number;
  isAvailable: boolean;
  metadata: any;
  skinAttributes: any;
  boosterAttributes: any;
  upgradeAttributes: UpgradeAttributes;
  partAttributes: PartAttributes;
}

export interface PartAttributes {
  itemId: string;
  equipmentType: string;
  requiredLevel: number;
}

export interface UpgradeAttributes {
  itemId: string
  upgradeType: string
  statIncrease: number
  maxLevel: number
  currentLevel: number
}

export type ItemType = "SKIN" | "REWARD" | "UPGRADE" | "BOOSTER" | "PART";

