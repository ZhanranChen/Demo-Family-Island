import "server-only";
import { createClient } from "@/lib/supabase/server";

interface SelectDailyIslandRewardInput {
  familyId: string;
  familyDayId: string;
  unlockedObjectHistory?: readonly string[];
  availablePlacementZones?: readonly string[];
  season?: string | null;
}

/**
 * Reusable server entry point for daily reward selection. History and valid
 * slots are intentionally re-derived inside Postgres so callers cannot make
 * stale or untrusted eligibility claims. The transaction-locked RPC returns
 * the already-persisted row when the family day was processed previously.
 */
export async function selectDailyIslandReward({
  familyId,
  familyDayId,
  season = null,
}: SelectDailyIslandRewardInput) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("select_daily_island_reward", {
    p_family_id: familyId,
    p_family_day_id: familyDayId,
    p_season: season,
  });
  if (error) throw error;
  return data;
}
