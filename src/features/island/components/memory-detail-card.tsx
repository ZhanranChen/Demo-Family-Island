"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { IslandMemoryRecord, IslandObjectRecord } from "../types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Deliberately light for this prototype — it shows the date an object was
 * earned, which is real data. Reopening that day's actual shared entries
 * (the fuller "memory lane" experience) needs a query into `entries` keyed
 * by `memoryId`, which is out of scope here per "do not add new product
 * features beyond the island renderer."
 */
export function MemoryDetailCard({
  object,
  memory,
  onClose,
  onMove,
  onStore,
  busy = false,
}: {
  object: IslandObjectRecord | null;
  memory?: IslandMemoryRecord | null;
  onClose: () => void;
  onMove?: () => void;
  onStore?: () => void;
  busy?: boolean;
}) {
  return (
    <AnimatePresence>
      {object && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-4 backdrop-blur-[2px] sm:items-center sm:justify-end sm:p-8"
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={object.name}
            className="bg-sand-50 dark:bg-dusk-700 border-sand-200 dark:border-dusk-500 rounded-pebble w-full max-w-sm border p-6"
          >
            {memory?.category ? <p className="memory-panel-type">{memory.category}</p> : null}
            <p className="font-display text-xl">{memory ? `A moment from ${memory.authorName}` : object.name}</p>
            <p className="text-ink-600 dark:text-mist-100/70 mt-1 text-sm">
              {memory ? `${memory.authorName} · ${formatDate(memory.createdAt)}` : `Earned ${formatDate(object.unlockedAt)}`}
            </p>
            {memory?.entries?.length ? (
              <div className="family-memory-entries">
                {memory.entries.map((entry) => (
                  <section key={entry.authorName}>
                    <strong>{entry.authorName}</strong>
                    <p>{entry.content}</p>
                  </section>
                ))}
              </div>
            ) : memory?.content || object.linkedMemorySummary ? (
              <p className="border-sand-200 dark:border-dusk-500 mt-4 border-t pt-4 text-sm leading-6">
                {memory?.content ?? object.linkedMemorySummary}
              </p>
            ) : null}
            {memory ? <p className="memory-detail-explainer">Every object on Family Island holds a family memory.</p> : null}
            <div className="memory-detail-actions">
              {onMove ? <button type="button" onClick={onMove} disabled={busy}>Move</button> : null}
              {onStore ? <button type="button" onClick={onStore} disabled={busy}>Remove from island</button> : null}
              <button type="button" onClick={onClose}>Close</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
