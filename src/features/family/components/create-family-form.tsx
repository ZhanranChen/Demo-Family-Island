"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createFamily } from "../actions";

export function CreateFamilyForm() {
  const [state, formAction, isPending] = useActionState(createFamily, null);

  if (state?.ok && state.inviteCode) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">{state.message}</p>
        <p className="font-mono bg-sand-200/60 dark:bg-dusk-500/60 rounded-pebble px-4 py-2.5 text-center text-lg tracking-widest">
          {state.inviteCode}
        </p>
        <Link href="/today">
          <Button className="w-full">Continue to today</Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="name" className="text-sm font-medium">
        Family name
      </label>
      <input
        id="name"
        name="name"
        required
        placeholder="The Nguyen Family"
        className="border-sand-200 dark:border-dusk-500 dark:bg-dusk-800 focus-visible:outline-none rounded-2xl border bg-transparent px-4 py-2.5 text-sm"
      />
      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create family"}
      </Button>
    </form>
  );
}
