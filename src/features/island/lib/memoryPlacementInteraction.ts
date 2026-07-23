import type { PendingMemorySeed, PlantedMemoryObject } from "../memory-seed-types";

export const PLACEMENT_DRAG_THRESHOLD_PX = 8;

export function screenPointToWorld(
  point: { x: number; y: number },
  bounds: { left: number; top: number; width: number; height: number },
) {
  return {
    x: Math.max(0, Math.min(1, (point.x - bounds.left) / bounds.width)),
    y: Math.max(0, Math.min(1, (point.y - bounds.top) / bounds.height)),
  };
}

export function isPlacementTap(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  return Math.hypot(end.x - start.x, end.y - start.y) <= PLACEMENT_DRAG_THRESHOLD_PX;
}

export function withoutPendingSeed(
  seeds: readonly PendingMemorySeed[],
  memoryId: string,
) {
  return seeds.filter((seed) => seed.memoryId !== memoryId);
}

export function resolvePlantedMemory(
  objects: readonly PlantedMemoryObject[],
  memoryId: string,
) {
  return objects.find((object) => object.memoryId === memoryId) ?? null;
}

export function upsertPlantedMemory(
  objects: readonly PlantedMemoryObject[],
  planted: PlantedMemoryObject,
) {
  const existingIndex = objects.findIndex((object) => object.memoryId === planted.memoryId);
  if (existingIndex < 0) return [...objects, planted];
  return objects.map((object, index) => index === existingIndex ? planted : object);
}
