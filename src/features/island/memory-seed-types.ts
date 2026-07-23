export type MemoryPlantType =
  | "wildflower"
  | "leafy_plant"
  | "mushroom"
  | "flower_stone"
  | "young_sapling";

export interface PendingMemorySeed {
  memoryId: string;
  date: string;
  text: string | null;
  objectType: MemoryPlantType;
}

export interface PlantedMemoryObject {
  id: string;
  familyId: string;
  memoryId: string;
  objectType: MemoryPlantType;
  positionX: number;
  positionY: number;
  scale: number;
  rotation: number;
  growthStage: number;
  placedAt: string;
  memoryDate: string;
  title: string | null;
  text: string | null;
  mediaUrl: string | null;
  mediaType: "text" | "voice" | "photo";
  contributorName: string | null;
}
