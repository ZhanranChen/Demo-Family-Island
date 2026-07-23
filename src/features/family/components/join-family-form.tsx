"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { joinFamily } from "../actions";

export function JoinFamilyForm() {
  const [state, formAction, isPending] = useActionState(joinFamily, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="inviteCode" className="text-sm font-medium">
        Invite code
      </label>
      <input
        id="inviteCode"
        name="inviteCode"
        required
        maxLength={8}
        placeholder="e.g. a3f9c1d2"
        className="border-sand-200 dark:border-dusk-500 dark:bg-dusk-800 focus-visible:outline-none rounded-2xl border bg-transparent px-4 py-2.5 text-sm lowercase"
      />
      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Joining..." : "Join family"}
      </Button>
    </form>
  );
}
