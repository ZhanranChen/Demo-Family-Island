"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { IslandBase } from "./island-base";
import { IslandObject, islandObjectWidthPercent } from "./island-object";
import { MemoryDetailCard } from "./memory-detail-card";
import { AmbientWorld } from "./ambient-world";
import { UnlockSequence } from "./unlock-sequence";
import { TimeOfDayLayer, type TimeOfDay } from "./time-of-day-layer";
import { IslandCamera } from "./island-camera";
import type { IslandData, IslandMemoryRecord, IslandObjectRecord } from "../types";
import { memoryPlacementInvalidReason } from "../lib/memoryPlacement";
import { isPlacementTap, screenPointToWorld } from "../lib/memoryPlacementInteraction";
import { moveFamilyDayReward, placeFamilyDayReward, storeFamilyDayReward } from "../reward-placement-actions";
import { resolveAsset } from "../lib/assetRegistry";
import { presentationForObject } from "../lib/islandAssetPresentation";

/**
 * The responsive canvas every object is positioned within. Fixed
 * aspect-ratio (matches the base asset's 1200x800), width-driven, so
 * percentage-based object coordinates land in the same relative spot on
 * desktop and mobile without separate layout logic per breakpoint.
 */
export function IslandScene({
  data,
  revealObjectId,
  demoMode,
  memories = [],
  allowObjectManagement = true,
  onObjectPlaced,
}: {
  data: IslandData;
  revealObjectId?: string;
  demoMode: boolean;
  memories?: IslandMemoryRecord[];
  allowObjectManagement?: boolean;
  onObjectPlaced?: (object: IslandObjectRecord) => void;
}) {
  const [objects, setObjects] = useState(data.objects);
  const [waitingRewards, setWaitingRewards] = useState(data.waitingRewards);
  const [selected, setSelected] = useState<IslandObjectRecord | null>(null);
  const [activeReward, setActiveReward] = useState<IslandObjectRecord | null>(null);
  const [preview, setPreview] = useState<{ x: number; y: number; reason: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [revealActive, setRevealActive] = useState(Boolean(revealObjectId));
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("daylight");
  const [zoom, setZoom] = useState(0.9);
  const rewardObject = useMemo(
    () => objects.find((object) => object.id === revealObjectId) ?? null,
    [objects, revealObjectId],
  );
  const selectedMemory = useMemo(
    () => selected?.memoryId ? memories.find((memory) => memory.id === selected.memoryId) ?? null : null,
    [memories, selected],
  );
  useEffect(() => {
    setObjects(data.objects);
    setWaitingRewards(data.waitingRewards);
  }, [data.objects, data.waitingRewards]);
  useEffect(() => {
    if (revealObjectId && objects.some((object) => object.id === revealObjectId)) {
      setRevealActive(true);
      setSelected(null);
    }
  }, [objects, revealObjectId]);
  const focusedObject = revealActive ? rewardObject : selected;
  const finishReveal = useCallback(() => {
    setRevealActive(false);
    if (rewardObject) setSelected(rewardObject);
  }, [rewardObject]);

  const pointFromEvent = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const normalized = screenPointToWorld(
      { x: event.clientX, y: event.clientY },
      event.currentTarget.getBoundingClientRect(),
    );
    const reason = memoryPlacementInvalidReason(
      normalized.x,
      normalized.y,
      objects
        .filter((object) => object.id !== activeReward?.id)
        .map((object) => ({
          positionX: object.positionX / 100,
          positionY: object.positionY / 100,
          collisionRadius: presentationForObject(object).collisionRadius,
        })),
      activeReward ? presentationForObject(activeReward).collisionRadius : undefined,
      activeReward?.objectType,
    );
    return { x: normalized.x * 100, y: normalized.y * 100, reason };
  }, [activeReward, objects]);

  const confirmPlacement = useCallback(async () => {
    if (!activeReward || !preview || preview.reason || busy) return;
    setBusy(true);
    try {
      await (demoMode
        ? Promise.resolve()
        : (activeReward.placementStatus === "placed" ? moveFamilyDayReward : placeFamilyDayReward)({
            rewardId: activeReward.id,
            positionX: preview.x,
            positionY: preview.y,
          }));
      const placed = {
        ...activeReward,
        positionX: preview.x,
        positionY: preview.y,
        zIndex: Math.round(preview.y) + 30,
        placementStatus: "placed" as const,
      };
      setObjects((current) => [...current.filter((object) => object.id !== placed.id), placed]);
      setWaitingRewards((current) => current.filter((object) => object.id !== placed.id));
      onObjectPlaced?.(placed);
      setActiveReward(null);
      setPreview(null);
      setNotice("Today left something new on your island.");
      window.setTimeout(() => setNotice(null), 3000);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "This trace could not be placed.");
    } finally {
      setBusy(false);
    }
  }, [activeReward, busy, demoMode, onObjectPlaced, preview]);

  const storeReward = useCallback(async (reward: IslandObjectRecord) => {
    setBusy(true);
    try {
      if (!demoMode) await storeFamilyDayReward(reward.id);
      const stored = { ...reward, placementStatus: "stored" as const };
      setObjects((current) => current.filter((object) => object.id !== reward.id));
      setWaitingRewards((current) => [...current.filter((object) => object.id !== reward.id), stored]);
      setSelected(null);
      setActiveReward(null);
      setPreview(null);
      setNotice("This trace is safe and can find a new home later.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "This trace could not be stored.");
    } finally {
      setBusy(false);
    }
  }, [demoMode]);

  const beginPlacement = (reward: IslandObjectRecord) => {
    setSelected(null);
    setActiveReward(reward);
    setPreview(null);
  };

  return (
    <div className="island-frame">
        <div className="island-viewport">
          <IslandCamera
            focusedObject={focusedObject}
            revealActive={revealActive}
            zoom={zoom}
            onZoomChange={setZoom}
          >
            <IslandBase />
            <AmbientWorld />
            {objects.map((object) => (
              <IslandObject
                key={object.id}
                object={object}
                onSelect={setSelected}
                isRewardObject={object.id === revealObjectId}
              />
            ))}
            {activeReward ? (
              <div
                className="memory-placement-surface"
                onPointerMove={(event) => {
                  if (pointerStart.current && event.buttons > 0) setPreview(pointFromEvent(event));
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  pointerStart.current = { x: event.clientX, y: event.clientY };
                }}
                onPointerUp={(event) => {
                  if (!pointerStart.current) return;
                  const start = pointerStart.current;
                  pointerStart.current = null;
                  if (isPlacementTap(start, { x: event.clientX, y: event.clientY })) {
                    setPreview(pointFromEvent(event));
                  }
                }}
                aria-label="Choose a home for today’s island trace"
              >
                {preview ? (
                  <div
                    className={preview.reason ? "reward-placement-preview is-invalid" : "reward-placement-preview is-valid"}
                    style={{
                      left: `${preview.x}%`,
                      top: `${preview.y}%`,
                      width: `${islandObjectWidthPercent({
                        ...activeReward,
                        positionX: preview.x,
                        positionY: preview.y,
                      })}%`,
                    }}
                  >
                    <span className="reward-placement-art">
                      <Image
                        src={resolveAsset(activeReward.assetKey, activeReward.objectType).src}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-contain"
                      />
                    </span>
                    <button
                      type="button"
                      className="reward-context-confirm"
                      disabled={Boolean(preview.reason) || busy}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => { event.stopPropagation(); void confirmPlacement(); }}
                    >
                      {busy ? "Planting…" : preview.reason ? "Choose another spot" : "Plant here"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="island-foreground" aria-hidden="true" />
          </IslandCamera>
          <TimeOfDayLayer
            mode={timeOfDay}
            onToggle={() => setTimeOfDay((current) => current === "daylight" ? "evening" : "daylight")}
          />
          <div className="island-caption">
            <p className="island-kicker">Day {data.growthLevel} · Growing together</p>
            <h1>
              <span>Our little</span>
              <br />
              <span>world</span>
            </h1>
            <p>Every shared moment leaves something beautiful behind.</p>
            <span>Explore the island</span>
          </div>
          {waitingRewards.length > 0 && !activeReward ? (
            <div className="memory-seed-prompt">
              <div>
                <strong>{waitingRewards.length === 1 ? "A new island trace is waiting for a home." : `${waitingRewards.length} island traces are waiting for a home.`}</strong>
                <span>Your family showed up together.</span>
              </div>
              <button type="button" onClick={() => beginPlacement(waitingRewards[0]!)}>Choose a place</button>
            </div>
          ) : null}
          {activeReward ? (
            <div className="placement-toolbar">
              <div>
                <strong>Choose a place for {activeReward.name}.</strong>
                <span>{preview?.reason === "occupied"
                  ? "This spot is already part of another trace."
                  : preview?.reason === "water"
                    ? "This trace needs island land."
                    : preview?.reason === "landmark"
                      ? "Keep this trace clear of the cabin and path."
                      : preview?.reason === "incompatible"
                        ? `${activeReward.name} belongs in a more natural part of the island.`
                        : "Drag or tap to preview a peaceful place."}</span>
              </div>
              <div className="placement-toolbar-actions">
                <button type="button" onClick={() => { setActiveReward(null); setPreview(null); }}>Place later</button>
                <button type="button" className="is-confirm" disabled={!preview || Boolean(preview.reason) || busy} onClick={() => void confirmPlacement()}>
                  {busy ? "Planting…" : "Plant here"}
                </button>
              </div>
            </div>
          ) : null}
          {notice ? <p className="planting-message">{notice}</p> : null}
        </div>
        <UnlockSequence object={revealActive ? rewardObject : null} onComplete={finishReveal} />
        <MemoryDetailCard
          object={selected}
          memory={selectedMemory}
          onClose={() => setSelected(null)}
          onMove={selected && allowObjectManagement ? () => beginPlacement(selected) : undefined}
          onStore={selected && allowObjectManagement ? () => void storeReward(selected) : undefined}
          busy={busy}
        />
      </div>
  );
}
