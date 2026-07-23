import type { PlantedMemoryObject } from "../memory-seed-types";
import type { IslandObjectType } from "../types";

export const MEMORY_PLACEMENT_RULES = {
  // MEMORY_PLACEMENT_RULESET_V1. Keep these values synchronized with
  // supabase/migrations/0005_memory_seeds.sql; tests verify the SQL contract.
  boundary: { minX: 0.14, maxX: 0.88, minY: 0.16, maxY: 0.86 },
  blockedRectangles: [
    { id: "cabin", minX: 0.28, maxX: 0.46, minY: 0.4, maxY: 0.59 },
    { id: "path", minX: 0.3, maxX: 0.48, minY: 0.56, maxY: 0.86 },
  ],
  // 3.5% lets small traces form natural clusters while still preventing
  // exact stacking. Visual overlap is intentional in the isometric scene.
  minimumDistance: 0.035,
} as const;

export type PlacementInvalidReason = "water" | "landmark" | "occupied" | "incompatible";

export const OBJECT_PLACEMENT_AREAS: Partial<Record<IslandObjectType, {
  minX: number; maxX: number; minY: number; maxY: number;
}>> = {
  tree: { minX: .16, maxX: .86, minY: .18, maxY: .76 },
  landmark: { minX: .16, maxX: .86, minY: .18, maxY: .76 },
  flower: { minX: .18, maxX: .86, minY: .24, maxY: .82 },
  garden: { minX: .18, maxX: .86, minY: .24, maxY: .82 },
  furniture: { minX: .2, maxX: .82, minY: .34, maxY: .82 },
  lantern: { minX: .24, maxX: .7, minY: .36, maxY: .84 },
  water: { minX: .52, maxX: .84, minY: .5, maxY: .82 },
};

export function memoryPlacementInvalidReason(
  x: number,
  y: number,
  objects: readonly (Pick<PlantedMemoryObject, "positionX" | "positionY"> & { collisionRadius?: number })[],
  currentCollisionRadius = MEMORY_PLACEMENT_RULES.minimumDistance / 2,
  objectType?: IslandObjectType,
): PlacementInvalidReason | null {
  const { boundary, blockedRectangles, minimumDistance } = MEMORY_PLACEMENT_RULES;
  // Everything outside the plantable land boundary is rendered water.
  if (x < boundary.minX || x > boundary.maxX || y < boundary.minY || y > boundary.maxY) {
    return "water";
  }
  if (blockedRectangles.some((zone) =>
    x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY
  )) {
    return "landmark";
  }
  const compatibleArea = objectType ? OBJECT_PLACEMENT_AREAS[objectType] : undefined;
  if (compatibleArea && (
    x < compatibleArea.minX || x > compatibleArea.maxX ||
    y < compatibleArea.minY || y > compatibleArea.maxY
  )) {
    return "incompatible";
  }
  if (objects.some((object) =>
    Math.hypot(object.positionX - x, object.positionY - y) <
      currentCollisionRadius + (object.collisionRadius ?? minimumDistance / 2)
  )) {
    return "occupied";
  }
  return null;
}

export function isValidMemoryPlacement(
  x: number,
  y: number,
  objects: readonly (Pick<PlantedMemoryObject, "positionX" | "positionY"> & { collisionRadius?: number })[],
) {
  return memoryPlacementInvalidReason(x, y, objects) === null;
}
