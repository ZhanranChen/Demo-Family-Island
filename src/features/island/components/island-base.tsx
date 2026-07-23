import Image from "next/image";
import { islandAssetRegistry } from "../lib/assetRegistry";

/**
 * Always present, never unlocked, never animated — the base is the one
 * thing on the canvas that isn't a "growth" object, so it's a separate
 * component rather than object id "0" in the objects array.
 */
export function IslandBase() {
  const base = islandAssetRegistry.island_base_01!;
  return (
    <div className="island-art" aria-hidden="true">
      <Image
        src={base.src}
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 150vw, 1280px"
        className="pointer-events-none select-none object-cover"
      />
      <div className="island-sunwash" />
      <div className="island-water-glow" />
      <div className="island-water-caustics" />
      <div className="island-vignette" />
    </div>
  );
}
