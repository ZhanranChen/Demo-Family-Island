import "server-only";
import { createClient } from "@/lib/supabase/server";
import { zoneForObjectType, positionWithinZone } from "./lib/placementZones";
import type { IslandData, IslandObjectRecord, IslandObjectType } from "./types";

interface RawPlacedDecorationRow {
  id: string;
  placed_at: string;
  decoration: { name: string; category: string; asset_url: string } | null;
  check_in_day: { id: string; date: string } | null;
  asset_key: string | null;
  object_type: string | null;
  rarity: "common" | "uncommon" | "rare" | "milestone" | null;
  placement_zone: string | null;
  position_x: number | null;
  position_y: number | null;
  z_index: number | null;
  unlocked_at: string | null;
  linked_memory_summary: string | null;
  placement_status: "pending_placement" | "placed" | "stored" | null;
}

/**
 * Maps real family_decorations rows to IslandObjectRecord. positionX/Y,
 * scale, rotation, and zIndex are NOT read from the database — they're
 * computed here via the same zone algorithm the placement system defines,
 * keyed off each object's running index within its category. This is what
 * "schema stays compatible" means concretely: adding a real position
 * later is an additive column + a branch here, not a rewrite.
 */
export async function getIslandData(familyId: string): Promise<IslandData> {
  const supabase = await createClient();

  const [{ data: state }, { data: placed }] = await Promise.all([
    supabase
      .from("island_state")
      .select("growth_level")
      .eq("family_id", familyId)
      .maybeSingle(),
    supabase
      .from("family_decorations")
      .select(
        "id, placed_at, asset_key, object_type, rarity, placement_zone, position_x, position_y, z_index, unlocked_at, linked_memory_summary, placement_status, decoration:decorations(name, category, asset_url), check_in_day:check_in_days(id, date)",
      )
      .eq("family_id", familyId)
      .order("placed_at", { ascending: true }) as unknown as Promise<{
      data: RawPlacedDecorationRow[] | null;
    }>,
  ]);

  const countByType: Partial<Record<IslandObjectType, number>> = {};

  const mapped: IslandObjectRecord[] = (placed ?? []).map((row) => {
    const objectType = (row.object_type ?? row.decoration?.category ?? "tree") as IslandObjectType;
    const indexInZone = countByType[objectType] ?? 0;
    countByType[objectType] = indexInZone + 1;

    const zone = zoneForObjectType(objectType);
    const { positionX, positionY, zIndex } = positionWithinZone(zone, indexInZone);

    return {
      id: row.id,
      objectType,
      assetKey: row.asset_key ?? row.decoration?.asset_url ?? "tree_pine_01",
      positionX: row.position_x ?? positionX,
      positionY: row.position_y ?? positionY,
      scale: 1,
      rotation: 0,
      zIndex: row.z_index ?? zIndex,
      unlockedAt: row.unlocked_at ?? row.check_in_day?.date ?? row.placed_at,
      memoryId: row.check_in_day?.id ?? null,
      name: row.decoration?.name ?? "A little surprise",
      rarity: row.rarity ?? undefined,
      placementZone: row.placement_zone ?? undefined,
      linkedMemorySummary: row.linked_memory_summary,
      placementStatus: row.placement_status ?? "placed",
    };
  });

  return {
    growthLevel: state?.growth_level ?? 0,
    objects: mapped.filter((object) => object.placementStatus === "placed"),
    waitingRewards: mapped.filter((object) => object.placementStatus !== "placed"),
  };
}
