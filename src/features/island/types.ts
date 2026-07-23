export type IslandObjectType =
  | "tree"
  | "flower"
  | "building"
  | "furniture"
  | "water"
  | "animal"
  | "lantern"
  | "garden"
  | "waterfront"
  | "landmark"
  | "bridge"
  | "seasonal";

export type PlacementZoneName =
  | "northGrove"
  | "centralHome"
  | "flowerMeadow"
  | "waterfront"
  | "animalArea";

/**
 * The full record shape requested for the asset-driven renderer. Not all
 * fields are stored in the database — see api.ts for which ones are
 * computed at read time versus read from a column, and README/DESIGN.md
 * for why.
 */
export interface IslandObjectRecord {
  id: string;
  objectType: IslandObjectType;
  assetKey: string;
  positionX: number; // percentage, 0-100, relative to the island canvas
  positionY: number; // percentage, 0-100
  scale: number;
  rotation: number; // degrees
  zIndex: number;
  unlockedAt: string; // ISO date
  memoryId: string | null; // check_in_days.id this object was earned from
  name: string;
  rarity?: "common" | "uncommon" | "rare" | "milestone";
  placementZone?: string;
  linkedMemorySummary?: string | null;
  placementStatus?: "pending_placement" | "placed" | "stored";
}

export interface IslandData {
  growthLevel: number;
  objects: IslandObjectRecord[];
  waitingRewards: IslandObjectRecord[];
}

/** Memory data supplied alongside island objects. Production may hydrate
 * these from Supabase; the public demo supplies the same shape locally. */
export interface IslandMemoryRecord {
  id: string;
  authorName: string;
  content: string;
  category?: string | null;
  createdAt: string;
  entries?: Array<{
    authorName: string;
    content: string;
  }>;
}
