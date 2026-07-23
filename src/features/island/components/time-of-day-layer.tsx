"use client";

import { motion, useReducedMotion } from "framer-motion";

export type TimeOfDay = "daylight" | "evening";

export function TimeOfDayLayer({ mode, onToggle }: { mode: TimeOfDay; onToggle: () => void }) {
  const reduced = useReducedMotion();
  return (
    <>
      <motion.div
        className="time-of-day-layer"
        aria-hidden="true"
        animate={{ opacity: mode === "evening" ? 1 : 0 }}
        transition={{ duration: reduced ? 0.15 : 1.8, ease: "easeInOut" }}
      />
      <button type="button" className="time-toggle" onClick={onToggle}>
        {mode === "evening" ? "Warm daylight" : "Evening light"}
      </button>
    </>
  );
}
