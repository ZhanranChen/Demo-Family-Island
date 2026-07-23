"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { sendMagicLink } from "../actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(sendMagicLink, null);

  // Once the link is sent, swap the form for a confirmation instead of
  // leaving a filled-in, now-stale email field on screen — there's nothing
  // left for the user to do here but check their inbox.
  if (state?.ok) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-moss-600 dark:text-moss-400 mt-6 text-sm"
      >
        {state.message}
      </motion.p>
    );
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="border-sand-200 dark:border-dusk-500 dark:bg-dusk-800 focus-visible:outline-none rounded-2xl border bg-transparent px-4 py-2.5 text-sm"
      />
      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="mt-1">
        {isPending ? "Sending..." : "Send me a sign-in link"}
      </Button>
    </form>
  );
}
