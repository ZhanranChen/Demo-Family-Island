"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { IslandObjectRecord } from "../types";

export function IslandCamera({
  children,
  focusedObject,
  revealActive,
  zoom,
  onZoomChange,
}: {
  children: ReactNode;
  focusedObject: IslandObjectRecord | null;
  revealActive: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  const reduced = useReducedMotion();
  const focusX = focusedObject ? (50 - focusedObject.positionX) * 3.2 : 0;
  const focusY = focusedObject ? (52 - focusedObject.positionY) * 2.1 : 0;

  return (
    <>
      <motion.div
        className="island-world"
        drag={!reduced && !revealActive}
        dragConstraints={{ left: -520, right: 520, top: -330, bottom: 330 }}
        dragElastic={0.08}
        dragMomentum
        animate={{
          scale: zoom + (focusedObject && !reduced ? 0.3 : 0),
          ...(focusedObject ? { x: focusX, y: focusY } : {}),
          filter: revealActive ? "saturate(.82) brightness(.78)" : "saturate(1) brightness(1)",
        }}
        transition={{ duration: reduced ? 0.15 : 1.05, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
      <div className="camera-controls" aria-label="Island camera controls">
        <button type="button" onClick={() => onZoomChange(Math.max(0.82, zoom - 0.12))} aria-label="Zoom out">−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => onZoomChange(Math.min(1.3, zoom + 0.12))} aria-label="Zoom in">+</button>
      </div>
      <p className="camera-hint">Drag to explore</p>
    </>
  );
}
