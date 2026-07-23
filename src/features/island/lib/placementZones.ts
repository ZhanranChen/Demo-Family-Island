import type { IslandObjectType, PlacementZoneName } from "../types";

interface Zone {
  /** Bounding box in percentage of the island canvas (0-100). */
  x: [number, number];
  y: [number, number];
  /** Added to the y-derived value below to keep a zone's z-index band from
   * colliding with another zone's — e.g. the waterfront sits visually in
   * front of the north grove even at a similar y, because dock/pond
   * objects are meant to read as "closer." */
  zBase: number;
}

/**
 * Rough regions of the island reserved for each kind of object, so
 * "flowers" never get placed on top of the cabin and the north grove
 * doesn't creep into the waterfront. Percentages, not pixels, so this
 * holds up at any canvas size — see IslandScene for how it's applied.
 */
export const PLACEMENT_ZONES: Record<PlacementZoneName, Zone> = {
  northGrove: { x: [8, 32], y: [10, 32], zBase: 10 },
  centralHome: { x: [34, 66], y: [22, 48], zBase: 30 },
  flowerMeadow: { x: [58, 88], y: [42, 62], zBase: 30 },
  waterfront: { x: [14, 44], y: [55, 80], zBase: 50 },
  animalArea: { x: [58, 80], y: [60, 80], zBase: 45 },
};

const ZONE_BY_OBJECT_TYPE: Record<IslandObjectType, PlacementZoneName> = {
  tree: "northGrove",
  flower: "flowerMeadow",
  building: "centralHome",
  furniture: "centralHome",
  water: "waterfront",
  animal: "animalArea",
  lantern: "centralHome",
  garden: "flowerMeadow",
  waterfront: "waterfront",
  landmark: "northGrove",
  bridge: "waterfront",
  seasonal: "flowerMeadow",
};

export function zoneForObjectType(type: IslandObjectType): PlacementZoneName {
  return ZONE_BY_OBJECT_TYPE[type];
}

/**
 * Deterministic pseudo-scatter: same (zone, index) always produces the
 * same point, so a family's island doesn't rearrange itself on every page
 * load, but different indices within a zone don't stack exactly on top of
 * each other either. Not true randomness — a simple irrational-step
 * sequence — which is enough spread for a handful of objects per zone.
 */
export function positionWithinZone(
  zone: PlacementZoneName,
  indexInZone: number,
) {
  const z = PLACEMENT_ZONES[zone];
  const stepX = (indexInZone * 0.618033) % 1; // golden-ratio spacing
  const stepY = (indexInZone * 0.381966) % 1;
  const positionX = z.x[0] + stepX * (z.x[1] - z.x[0]);
  const positionY = z.y[0] + stepY * (z.y[1] - z.y[0]);
  // Lower on screen (larger y) reads as "closer" in this soft-isometric
  // scene, so it should stack above zones/objects behind it.
  const zIndex = Math.round(z.zBase + positionY);
  return { positionX, positionY, zIndex };
}
