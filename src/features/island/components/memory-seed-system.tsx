"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { plantMemorySeed } from "../memory-seed-actions";
import { memoryPlacementInvalidReason, type PlacementInvalidReason } from "../lib/memoryPlacement";
import {
  isPlacementTap,
  screenPointToWorld,
  upsertPlantedMemory,
  withoutPendingSeed,
} from "../lib/memoryPlacementInteraction";
import { MEMORY_PLANT_REGISTRY } from "../lib/memoryPlantRegistry";
import { resolveAsset } from "../lib/assetRegistry";
import type { PendingMemorySeed, PlantedMemoryObject } from "../memory-seed-types";

interface PreviewPoint {
  x: number;
  y: number;
  valid: boolean;
  reason: PlacementInvalidReason | null;
}

interface MemorySeedContextValue {
  pendingSeeds: PendingMemorySeed[];
  plantedObjects: PlantedMemoryObject[];
  activeSeed: PendingMemorySeed | null;
  preview: PreviewPoint | null;
  selected: PlantedMemoryObject | null;
  plantingId: string | null;
  message: string | null;
  startPlacement: () => void;
  cancelPlacement: () => void;
  confirmPlacement: () => Promise<void>;
  setSelected: (object: PlantedMemoryObject | null) => void;
  handlePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  handlePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (event: PointerEvent<HTMLDivElement>) => void;
}

const MemorySeedContext = createContext<MemorySeedContextValue | null>(null);

function useMemorySeeds() {
  const value = useContext(MemorySeedContext);
  if (!value) throw new Error("Memory Seed components require MemorySeedProvider");
  return value;
}

export function MemorySeedProvider({
  initialPendingSeeds,
  initialPlantedObjects,
  demoMode,
  children,
}: {
  initialPendingSeeds: PendingMemorySeed[];
  initialPlantedObjects: PlantedMemoryObject[];
  demoMode: boolean;
  children: ReactNode;
}) {
  const [pendingSeeds, setPendingSeeds] = useState(initialPendingSeeds);
  const [plantedObjects, setPlantedObjects] = useState(initialPlantedObjects);
  const [activeSeed, setActiveSeed] = useState<PendingMemorySeed | null>(null);
  const [preview, setPreview] = useState<PreviewPoint | null>(null);
  const [selected, setSelected] = useState<PlantedMemoryObject | null>(null);
  const [plantingId, setPlantingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const pointFromEvent = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const { x, y } = screenPointToWorld(
      { x: event.clientX, y: event.clientY },
      bounds,
    );
    const reason = memoryPlacementInvalidReason(x, y, plantedObjects);
    return { x, y, valid: reason === null, reason };
  }, [plantedObjects]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (activeSeed) setPreview(pointFromEvent(event));
  }, [activeSeed, pointFromEvent]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!activeSeed || !pointerStart.current) return;
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!isPlacementTap(start, { x: event.clientX, y: event.clientY })) return;

    const point = pointFromEvent(event);
    setPreview(point);
  }, [activeSeed, pointFromEvent]);

  const confirmPlacement = useCallback(async () => {
    if (!activeSeed || !preview?.valid) return;
    const seed = activeSeed;
    setPlantingId(seed.memoryId);
    try {
      const persisted = demoMode
        ? null
        : await plantMemorySeed({
          memoryId: seed.memoryId,
          positionX: preview.x,
          positionY: preview.y,
        });
      const registry = MEMORY_PLANT_REGISTRY[seed.objectType];
      const planted: PlantedMemoryObject = {
        id: persisted?.id ?? `demo-${seed.memoryId}`,
        familyId: persisted?.family_id ?? "demo-family",
        memoryId: seed.memoryId,
        objectType: persisted?.object_type ?? seed.objectType,
        positionX: persisted?.position_x ?? preview.x,
        positionY: persisted?.position_y ?? preview.y,
        scale: persisted?.scale ?? registry.scale,
        rotation: persisted?.rotation ?? 0,
        growthStage: persisted?.growth_stage ?? 1,
        placedAt: persisted?.placed_at ?? new Date().toISOString(),
        memoryDate: seed.date,
        title: null,
        text: seed.text,
        mediaUrl: null,
        mediaType: "text",
        contributorName: demoMode ? "Mom" : null,
      };
      setPlantedObjects((current) => upsertPlantedMemory(current, planted));
      setPendingSeeds((current) => withoutPendingSeed(current, seed.memoryId));
      setActiveSeed(null);
      setPreview(null);
      setMessage("Today left a new trace on your island.");
      window.setTimeout(() => setPlantingId(null), 2400);
      window.setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setPlantingId(null);
      setMessage(error instanceof Error ? error.message : "This spot could not be planted.");
    }
  }, [activeSeed, demoMode, preview]);

  const value = useMemo<MemorySeedContextValue>(() => ({
    pendingSeeds,
    plantedObjects,
    activeSeed,
    preview,
    selected,
    plantingId,
    message,
    startPlacement: () => setActiveSeed(pendingSeeds[0] ?? null),
    cancelPlacement: () => { setActiveSeed(null); setPreview(null); },
    confirmPlacement,
    setSelected,
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
  }), [
    pendingSeeds, plantedObjects, activeSeed, preview, selected, plantingId,
    message, confirmPlacement, handlePointerMove, handlePointerDown, handlePointerUp,
  ]);

  return <MemorySeedContext.Provider value={value}>{children}</MemorySeedContext.Provider>;
}

export function MemorySeedPrompt() {
  const {
    pendingSeeds, activeSeed, preview, startPlacement, cancelPlacement,
    confirmPlacement, message,
  } = useMemorySeeds();
  const previewMessage = preview?.reason === "occupied"
    ? "This spot is already part of another memory."
    : preview?.reason === "landmark"
      ? "Choose open grass away from the cabin and path."
      : preview?.reason === "water"
        ? "This memory needs a patch of grass."
        : preview
          ? "This is a peaceful place for this memory."
          : "Tap a patch of grass to preview its new home.";
  return (
    <>
      <AnimatePresence>
        {pendingSeeds.length > 0 && !activeSeed ? (
          <motion.div
            className="memory-seed-prompt"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div>
              <strong>
                {pendingSeeds.length === 1
                  ? "A memory is waiting to take root."
                  : `You have ${pendingSeeds.length} memories waiting to be planted.`}
              </strong>
              <span>Choose a quiet patch of grass for today’s trace.</span>
            </div>
            <button type="button" onClick={startPlacement}>Plant Memory</button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {activeSeed ? (
        <div className="placement-toolbar">
          <div role="status">
            <strong>Choose a place for this memory.</strong>
            <span>{activeSeed.text ? `“${activeSeed.text.slice(0, 72)}${activeSeed.text.length > 72 ? "…" : ""}”` : previewMessage}</span>
            {activeSeed.text ? <small>{previewMessage}</small> : null}
          </div>
          <div className="placement-toolbar-actions">
            <button type="button" onClick={cancelPlacement}>Cancel</button>
            <button type="button" className="is-confirm" disabled={!preview?.valid} onClick={() => void confirmPlacement()}>
              Plant here
            </button>
          </div>
        </div>
      ) : null}
      <AnimatePresence>
        {message ? (
          <motion.p
            className="planting-message"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function PlantArtwork({
  objectType,
  preview = false,
}: {
  objectType: PendingMemorySeed["objectType"];
  preview?: boolean;
}) {
  const registry = MEMORY_PLANT_REGISTRY[objectType];
  const objectTypeForFallback = objectType === "young_sapling" ? "tree" : "flower";
  const asset = resolveAsset(registry.assetKey, objectTypeForFallback);
  return (
    <Image
      src={asset.src}
      alt=""
      fill
      sizes="120px"
      className={preview ? "object-contain opacity-60" : "object-contain"}
    />
  );
}

export function MemorySeedWorldLayer() {
  const {
    activeSeed, preview, plantedObjects, plantingId, setSelected,
    handlePointerMove, handlePointerDown, handlePointerUp,
  } = useMemorySeeds();
  const reduced = useReducedMotion();

  return (
    <>
      {plantedObjects.map((object) => {
        const registry = MEMORY_PLANT_REGISTRY[object.objectType];
        const isPlanting = plantingId === object.memoryId;
        return (
          <motion.button
            key={object.id}
            type="button"
            className={isPlanting ? "memory-plant-object is-planting" : "memory-plant-object"}
            style={{
              left: `${object.positionX * 100}%`,
              top: `${object.positionY * 100}%`,
              width: `max(${8 * registry.scale}%, 44px)`,
              rotate: object.rotation,
            }}
            initial={isPlanting && !reduced ? { opacity: 0, scale: 0.15, y: 14 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduced ? 0.15 : 2.2, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reduced ? undefined : { y: -2, scale: 1.04 }}
            onClick={(event) => { event.stopPropagation(); setSelected(object); }}
            aria-label={`Open ${registry.name} memory from ${object.memoryDate}`}
          >
            <span className="relative block aspect-square w-full">
              <PlantArtwork objectType={object.objectType} />
            </span>
          </motion.button>
        );
      })}
      {activeSeed ? (
        <div
          className="memory-placement-surface"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          role="application"
          aria-label="Memory Seed placement area. Drag to pan or tap clear grass to plant."
        >
          {preview ? (
            <div
              className={preview.valid ? "memory-plant-preview is-valid" : "memory-plant-preview is-invalid"}
              style={{ left: `${preview.x * 100}%`, top: `${preview.y * 100}%` }}
            >
              <span className="relative block aspect-square w-full">
                <PlantArtwork objectType={activeSeed.objectType} preview />
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export function MemorySeedPanel() {
  const { selected, setSelected } = useMemorySeeds();
  const registry = selected ? MEMORY_PLANT_REGISTRY[selected.objectType] : null;
  return (
    <AnimatePresence>
      {selected && registry ? (
        <motion.div
          className="memory-seed-panel-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelected(null)}
        >
          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            onClick={(event) => event.stopPropagation()}
            aria-label={`${registry.name} memory`}
          >
            <button type="button" className="memory-panel-close" onClick={() => setSelected(null)} aria-label="Close memory">×</button>
            <p className="memory-panel-type">{registry.name}</p>
            <h2>{new Date(selected.memoryDate).toLocaleDateString(undefined, {
              month: "long", day: "numeric", year: "numeric",
            })}</h2>
            {selected.title ? <h3>{selected.title}</h3> : null}
            {selected.mediaUrl && selected.mediaType === "photo" ? (
              <div
                className="memory-panel-photo"
                role="img"
                aria-label="Memory photo"
                style={{ backgroundImage: `url(${selected.mediaUrl})` }}
              />
            ) : null}
            <blockquote>{selected.text || "A family moment was shared today."}</blockquote>
            <p className="memory-panel-meta">
              {selected.mediaType === "photo" ? "1 photo" : "A daily memory"}
              {selected.contributorName ? ` · Added by ${selected.contributorName}` : ""}
            </p>
            <Link href={`/journal?memory=${encodeURIComponent(selected.memoryId)}`}>View Full Memory</Link>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
