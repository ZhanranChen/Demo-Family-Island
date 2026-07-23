import type { IslandObjectRecord, IslandObjectType } from "../types";

export interface IslandAssetPresentation {
  visualScale: number;
  anchorY: number;
  shadowWidth: number;
  shadowOpacity: number;
  collisionRadius: number;
}

const DEFAULT_BY_TYPE: Record<IslandObjectType, IslandAssetPresentation> = {
  flower: { visualScale: 1, anchorY: 96, shadowWidth: 58, shadowOpacity: .2, collisionRadius: .012 },
  garden: { visualScale: 1, anchorY: 95, shadowWidth: 64, shadowOpacity: .22, collisionRadius: .015 },
  lantern: { visualScale: 1, anchorY: 97, shadowWidth: 42, shadowOpacity: .2, collisionRadius: .012 },
  animal: { visualScale: 1, anchorY: 96, shadowWidth: 54, shadowOpacity: .22, collisionRadius: .016 },
  furniture: { visualScale: 1, anchorY: 94, shadowWidth: 78, shadowOpacity: .24, collisionRadius: .022 },
  bridge: { visualScale: 1, anchorY: 92, shadowWidth: 84, shadowOpacity: .2, collisionRadius: .035 },
  waterfront: { visualScale: 1, anchorY: 92, shadowWidth: 84, shadowOpacity: .2, collisionRadius: .035 },
  water: { visualScale: 1, anchorY: 86, shadowWidth: 88, shadowOpacity: .15, collisionRadius: .04 },
  tree: { visualScale: 1, anchorY: 96, shadowWidth: 72, shadowOpacity: .26, collisionRadius: .026 },
  building: { visualScale: 1, anchorY: 94, shadowWidth: 82, shadowOpacity: .28, collisionRadius: .04 },
  landmark: { visualScale: 1, anchorY: 96, shadowWidth: 78, shadowOpacity: .28, collisionRadius: .032 },
  seasonal: { visualScale: 1, anchorY: 95, shadowWidth: 60, shadowOpacity: .2, collisionRadius: .016 },
};

const PRESENTATION_BY_ASSET: Record<string, Partial<IslandAssetPresentation>> = {
  tree_deciduous_webp_01: { visualScale: .88, anchorY: 94, collisionRadius: .029 },
  tree_pine_webp_01: { visualScale: .82, anchorY: 94, collisionRadius: .026 },
  flowers_meadow_webp_01: { visualScale: .72, anchorY: 91, collisionRadius: .011 },
  bench_garden_webp_01: { visualScale: .78, anchorY: 91, collisionRadius: .021 },
  lantern_path_webp_01: { visualScale: .72, anchorY: 94, shadowWidth: 38, collisionRadius: .011 },
  cat_orange_webp_01: { visualScale: .64, anchorY: 91, collisionRadius: .014 },
  mushrooms_red_webp_01: { visualScale: .6, anchorY: 91, collisionRadius: .012 },
  pond_lily_webp_01: { visualScale: .86, anchorY: 83, shadowWidth: 90, collisionRadius: .042 },
};

export function presentationForObject(
  object: Pick<IslandObjectRecord, "assetKey" | "objectType">,
): IslandAssetPresentation {
  return {
    ...DEFAULT_BY_TYPE[object.objectType],
    ...PRESENTATION_BY_ASSET[object.assetKey],
  };
}
