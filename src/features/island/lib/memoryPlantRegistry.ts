import type { MemoryPlantType } from "../memory-seed-types";

interface MemoryPlantAsset {
  name: string;
  assetKey: string;
  scale: number;
}

export const MEMORY_PLANT_REGISTRY: Record<MemoryPlantType, MemoryPlantAsset> = {
  wildflower: { name: "Wildflower", assetKey: "flower_cluster_01", scale: 0.42 },
  leafy_plant: { name: "Leafy plant", assetKey: "flower_cluster_01", scale: 0.34 },
  mushroom: { name: "Mushroom", assetKey: "flower_cluster_01", scale: 0.25 },
  flower_stone: { name: "Flowering stone", assetKey: "flower_cluster_01", scale: 0.3 },
  young_sapling: { name: "Young sapling", assetKey: "tree_pine_01", scale: 0.4 },
};

const MEMORY_PLANT_TYPES = Object.keys(MEMORY_PLANT_REGISTRY) as MemoryPlantType[];

export function memoryPlantTypeForId(memoryId: string): MemoryPlantType {
  let hash = 2166136261;
  for (const char of memoryId) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return MEMORY_PLANT_TYPES[Math.abs(hash) % MEMORY_PLANT_TYPES.length]!;
}
