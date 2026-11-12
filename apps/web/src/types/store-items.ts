export interface StoreItem {
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
  price: any;
  category: string;
  featured: boolean;
  displayOrder: number;
  isAvailable: boolean;
  metadata: any;
  skinAttributes: any;
  boosterAttributes: any;
  upgradeAttributes: any;
  partAttributes: any;
}
