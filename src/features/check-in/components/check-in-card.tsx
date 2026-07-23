"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { submitTextEntry } from "../actions";
import type { CheckInDaySummary } from "../types";

/**
 * Text-only for the MVP slice (see roadmap Phase 2) — voice and photo
 * composers are separate components added in Phase 4, swapped in via a
 * tab control, so this component doesn't grow a type-switch on every field.
 */
export function CheckInCard({ day }: { day: CheckInDaySummary }) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const isUnlocked = day.status === "unlocked";

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitTextEntry(formData);
      if (result.rewardId) {
        setIsUnlocking(true);
        window.setTimeout(() => {
          router.push(`/island?reveal=${encodeURIComponent(result.rewardId!)}`);
        }, prefersReducedMotion ? 250 : 1350);
        return;
      }
      setSubmitted(true);
    });
  }

  return (
    <Card>
      <p className="font-display text-xl">
        {day.promptText ?? "What made today feel like today?"}
      </p>

      {/* Presence, not content: shows who's shown up without revealing what
          anyone said, preserving the "everyone must arrive" feeling without
          peeking pressure — see the architecture doc's open design question. */}
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Family check-in status">
        {day.members.map((member) => (
          <li
            key={member.userId}
            className="bg-sand-200/60 dark:bg-dusk-500/60 rounded-pebble flex items-center gap-1.5 px-3 py-1 text-sm"
          >
            <span
              className={
                member.hasCheckedIn
                  ? "bg-moss-500 size-2 rounded-full"
                  : "bg-ink-600/30 dark:bg-mist-100/30 size-2 rounded-full"
              }
              aria-hidden
            />
            {member.displayName || "Family member"}
          </li>
        ))}
      </ul>

      <AnimatePresence mode="wait">
        {isUnlocking ? (
          <motion.div
            key="unlocking"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl bg-moss-500/10 p-4"
            role="status"
          >
            <p className="font-display text-lg">Something new is growing…</p>
            <p className="text-ink-600 dark:text-mist-100/70 mt-1 text-sm">
              What will our island grow today?
            </p>
          </motion.div>
        ) : submitted ? (
          <motion.p
            key="thanks"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-moss-600 dark:text-moss-400 mt-6 text-sm"
          >
            Shared. Come back tomorrow.
          </motion.p>
        ) : (
          <motion.form
            key="form"
            action={handleSubmit}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            className="mt-6"
          >
            <input type="hidden" name="checkInDayId" value={day.id} />
            <textarea
              name="textContent"
              required
              maxLength={2000}
              rows={3}
              placeholder="Share a moment from today..."
              disabled={isUnlocked}
              className="border-sand-200 dark:border-dusk-500 dark:bg-dusk-800 focus-visible:outline-none w-full resize-none rounded-2xl border bg-transparent p-3 text-sm"
            />
            <div className="mt-3 flex justify-end">
              <Button type="submit" disabled={isPending || isUnlocked}>
                {isPending ? "Sharing..." : "Share"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
}
