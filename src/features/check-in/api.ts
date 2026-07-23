import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CheckInDaySummary, EntryKind } from "./types";

/**
 * All Supabase queries for a feature live in that feature's api.ts, never
 * directly inside a page or component. Two reasons:
 *  1. `import "server-only"` above makes it a build error if a Client
 *     Component ever tries to import this file, catching a whole class of
 *     "leaked service key" bugs at compile time instead of in production.
 *  2. Row Level Security is our real authorization boundary — these
 *     functions don't re-check "is this my family?" because Postgres
 *     already refuses the query otherwise. That means this file should
 *     stay a thin, boring mapping layer, not where business rules live.
 */

export async function getTodaySummary(
  familyId: string,
): Promise<CheckInDaySummary | null> {
  const supabase = await createClient();

  const { data: day, error } = await supabase
    .from("check_in_days")
    .select("id, date, status, prompt_id")
    .eq("family_id", familyId)
    .eq("date", new Date().toISOString().slice(0, 10))
    .maybeSingle();

  if (error || !day) return null;

  const { data: members } = await supabase
    .from("family_members")
    .select("user_id, entries:entries(user_id)")
    .eq("family_id", familyId);

  return {
    id: day.id,
    date: day.date,
    promptText: null, // resolved via a prompt lookup once daily_prompts exists
    status: day.status,
    members: (members ?? []).map((m) => ({
      userId: m.user_id,
      displayName: "", // filled in by joining `profiles` once that table exists
      avatarUrl: null,
      hasCheckedIn: Array.isArray(m.entries) && m.entries.length > 0,
    })),
  };
}

interface SubmitEntryInput {
  checkInDayId: string;
  type: EntryKind;
  textContent?: string;
  mediaUrl?: string;
  mediaDurationSec?: number;
}

/**
 * Inserts today's entry for the current user. Unlock detection is NOT done
 * here in application code — it's a Postgres trigger (see
 * supabase/migrations) that flips `check_in_days.status` to 'unlocked' the
 * moment every family member has a row in `entries` for that day. Doing it
 * as a DB trigger means the invariant holds even if two family members
 * submit at the exact same millisecond, which a "check count, then update"
 * read-modify-write in application code could race on.
 */
export async function submitEntry(input: SubmitEntryInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("entries").insert({
    check_in_day_id: input.checkInDayId,
    user_id: user.id,
    type: input.type,
    text_content: input.textContent ?? null,
    media_url: input.mediaUrl ?? null,
    media_duration_sec: input.mediaDurationSec ?? null,
  });

  if (error) throw error;

  const [{ data: reward }, { data: day }] = await Promise.all([
    supabase
      .from("family_decorations")
      .select("id")
      .eq("check_in_day_id", input.checkInDayId)
      .maybeSingle(),
    supabase
      .from("check_in_days")
      .select("status")
      .eq("id", input.checkInDayId)
      .single(),
  ]);

  return {
    islandUnlocked: day?.status === "unlocked",
    rewardId: reward?.id ?? null,
  };
}
