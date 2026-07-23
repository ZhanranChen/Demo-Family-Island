"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { resolveAsset } from "../lib/assetRegistry";
import { presentationForObject } from "../lib/islandAssetPresentation";
import type { IslandObjectRecord } from "../types";

const BASE_WIDTH_BY_TYPE: Record<IslandObjectRecord["objectType"], number> = {
  flower: 3.2,
  garden: 4.2,
  lantern: 3.8,
  animal: 4.8,
  furniture: 5.4,
  bridge: 7.5,
  waterfront: 7.5,
  water: 7,
  tree: 6.4,
  building: 8,
  landmark: 8.5,
  seasonal: 4.5,
};

export function islandObjectWidthPercent(object: IslandObjectRecord) {
  const presentation = presentationForObject(object);
  const depthScale = 0.82 + Math.max(0, Math.min(1, object.positionY / 100)) * 0.25;
  return BASE_WIDTH_BY_TYPE[object.objectType] * object.scale * depthScale * presentation.visualScale;
}

export function IslandObject({
  object,
  onSelect,
  isRewardObject = false,
}: {
  object: IslandObjectRecord;
  onSelect: (object: IslandObjectRecord) => void;
  isRewardObject?: boolean;
}) {
  const asset = resolveAsset(object.assetKey, object.objectType);
  const prefersReducedMotion = useReducedMotion();
  // Objects remain modest in the whole-island composition. Their invisible
  // hit target is expanded separately in CSS, and selection zooms the camera.
  const widthPercent = islandObjectWidthPercent(object);
  const presentation = presentationForObject(object);
  const aspectRatio = asset.width / asset.height;

  return (
    // Outer element owns static position/rotation via a plain CSS
    // transform. The inner motion.button owns Framer Motion's own
    // transform-driven animation (scale/y on unlock, hover, tap) — Framer
    // Motion writes directly to `transform`, so it would silently
    // overwrite a hand-set translate/rotate on the same element if both
    // lived together.
    <div
      className={`island-object island-object-${object.objectType} absolute`}
      style={{
        left: `${object.positionX}%`,
        top: `${object.positionY}%`,
        width: `${widthPercent}%`,
        zIndex: object.zIndex,
        transform: `translate(-50%, -${presentation.anchorY}%) rotate(${object.rotation}deg)`,
        "--object-shadow-width": `${presentation.shadowWidth}%`,
        "--object-shadow-opacity": presentation.shadowOpacity,
      } as CSSProperties}
    >
      <motion.button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onSelect(object)}
        aria-label={`${object.name}, earned ${new Date(object.unlockedAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })}`}
        className="island-hotspot group relative block w-full cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none"
        initial={prefersReducedMotion ? undefined : { opacity: 0, scale: isRewardObject ? 0.08 : 0.92, y: isRewardObject ? 24 : 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.035, y: -2 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
        transition={isRewardObject
          ? { delay: prefersReducedMotion ? 0 : 1.8, duration: prefersReducedMotion ? 0.15 : 2.1, type: "spring", stiffness: 90, damping: 14 }
          : { type: "spring", stiffness: 220, damping: 20 }}
      >
        <div style={{ aspectRatio, position: "relative", width: "100%" }}>
          <span className="island-object-ground-shadow" aria-hidden="true" />
          <Image
            src={asset.src}
            alt=""
            fill
            sizes="120px"
            style={{ objectFit: "contain" }}
            className="island-hotspot-asset is-display-ready"
          />
          <span className="island-object-ground-grass" aria-hidden="true" />
          <span className="island-hotspot-ring" />
          <span className="island-hotspot-label">{object.name}</span>
        </div>
      </motion.button>
    </div>
  );
}
