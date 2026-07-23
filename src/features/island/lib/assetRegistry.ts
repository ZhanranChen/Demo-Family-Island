import type { IslandObjectType } from "../types";

interface AssetEntry {
  src: string;
  /** Intrinsic pixel size of the source file, used for Next/Image and to
   * compute aspect-correct render size at each object's `scale`. */
  width: number;
  height: number;
}

/**
 * Every value here points at a placeholder SVG today (see
 * public/assets/island/**). Replacing an asset with real, high-quality
 * artwork later is exactly this: swap the `src` (and width/height, if the
 * new file's native size differs) — nothing in the component tree reads
 * asset paths anywhere else, so no rendering code changes.
 */
export const islandAssetRegistry: Record<string, AssetEntry> = {
  island_base_01: {
    // Sparse Day-1 prototype. Replace with the final layered WebP terrain.
    src: "/assets/island/scenes/island-day-one-prototype.jpg",
    width: 1536,
    height: 1024,
  },
  path_stone_01: {
    src: "/assets/island/base/path-stone-01.svg",
    width: 220,
    height: 90,
  },
  tree_pine_01: {
    src: "/assets/island/trees/tree-pine-01.svg",
    width: 160,
    height: 200,
  },
  flower_cluster_01: {
    // Generated prototype reveal asset. Replace with final transparent WebP.
    src: "/assets/island/flowers/prototype/flower-cluster-reveal.png",
    width: 1254,
    height: 1254,
  },
  cabin_01: {
    src: "/assets/island/buildings/cabin-01.svg",
    width: 300,
    height: 280,
  },
  bench_01: {
    src: "/assets/island/furniture/bench-01.svg",
    width: 140,
    height: 90,
  },
  pond_01: {
    src: "/assets/island/water/pond-01.svg",
    width: 260,
    height: 160,
  },
  cat_01: {
    src: "/assets/island/animals/cat-01.svg",
    width: 100,
    height: 90,
  },
  tree_deciduous_webp_01: {
    src: "/assets/island/production-v1/tree-deciduous.webp",
    width: 1205,
    height: 1306,
  },
  tree_pine_webp_01: {
    src: "/assets/island/production-v1/tree-pine.webp",
    width: 1254,
    height: 1254,
  },
  flowers_meadow_webp_01: {
    src: "/assets/island/production-v1/flowers-meadow.webp",
    width: 1402,
    height: 1122,
  },
  bench_garden_webp_01: {
    src: "/assets/island/production-v1/bench-garden.webp",
    width: 1402,
    height: 1122,
  },
  lantern_path_webp_01: {
    src: "/assets/island/production-v1/lantern-path.webp",
    width: 1024,
    height: 1536,
  },
  cat_orange_webp_01: {
    src: "/assets/island/production-v1/cat-orange.webp",
    width: 1254,
    height: 1254,
  },
  mushrooms_red_webp_01: {
    src: "/assets/island/production-v1/mushrooms-red.webp",
    width: 1254,
    height: 1254,
  },
  pond_lily_webp_01: {
    src: "/assets/island/production-v1/pond-lily.webp",
    width: 1536,
    height: 1024,
  },
};

/** Fallback used only if a decoration references an assetKey that isn't
 * (yet) in the registry — keeps a bad DB row from crashing the page. */
export const fallbackAssetByType: Record<IslandObjectType, string> = {
  tree: "tree_pine_01",
  flower: "flower_cluster_01",
  building: "cabin_01",
  furniture: "bench_01",
  water: "pond_01",
  animal: "cat_01",
  lantern: "bench_01",
  garden: "flower_cluster_01",
  waterfront: "path_stone_01",
  landmark: "tree_pine_01",
  bridge: "path_stone_01",
  seasonal: "flower_cluster_01",
};

export function resolveAsset(assetKey: string, objectType: IslandObjectType) {
  return (
    islandAssetRegistry[assetKey] ??
    islandAssetRegistry[fallbackAssetByType[objectType]]!
  );
}
