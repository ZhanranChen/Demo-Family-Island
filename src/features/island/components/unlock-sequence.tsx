"use client";

import { useEffect, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { IslandObjectRecord } from "../types";

export function UnlockSequence({ object, onComplete }: { object: IslandObjectRecord | null; onComplete: () => void }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!object) return;
    const timer = window.setTimeout(onComplete, reduced ? 700 : 5100);
    return () => window.clearTimeout(timer);
  }, [object, onComplete, reduced]);

  return (
    <AnimatePresence>
      {object ? (
        <motion.div
          className="unlock-sequence"
          style={{
            "--unlock-x": `${object.positionX}%`,
            "--unlock-y": `${object.positionY}%`,
          } as CSSProperties}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.15 : 0.8 }}
          aria-live="polite"
        >
          <motion.div
            className="unlock-copy"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.35 }}
          >
            <span>The island noticed</span>
            <strong>Something new is growing…</strong>
          </motion.div>
          <motion.div
            className="unlock-memory-caption"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduced ? 0.15 : 3.9, duration: 0.7 }}
          >
            {object.linkedMemorySummary || "Today, Mom shared a quiet walk home."}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
