import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isValidMemoryPlacement,
  memoryPlacementInvalidReason,
} from "../src/features/island/lib/memoryPlacement.ts";
import {
  isPlacementTap,
  resolvePlantedMemory,
  screenPointToWorld,
  upsertPlantedMemory,
  withoutPendingSeed,
} from "../src/features/island/lib/memoryPlacementInteraction.ts";
import { memoryPlantTypeForId } from "../src/features/island/lib/memoryPlantRegistry.ts";
import type { PendingMemorySeed, PlantedMemoryObject } from "../src/features/island/memory-seed-types.ts";

const object = (memoryId: string, x: number, y: number): PlantedMemoryObject => ({
  id: `object-${memoryId}`, familyId: "family", memoryId, objectType: "wildflower",
  positionX: x, positionY: y, scale: 1, rotation: 0, growthStage: 1,
  placedAt: "2026-07-16T00:00:00Z", memoryDate: "2026-07-16", title: null,
  text: memoryId, mediaUrl: null, mediaType: "text", contributorName: "Family",
});

test("accepts valid grass and rejects water/outside, cabin, path, and occupied grass", () => {
  assert.equal(isValidMemoryPlacement(0.7, 0.5, []), true);
  assert.equal(memoryPlacementInvalidReason(0.05, 0.5, []), "water");
  assert.equal(memoryPlacementInvalidReason(0.35, 0.5, []), "landmark");
  assert.equal(memoryPlacementInvalidReason(0.4, 0.7, []), "landmark");
  assert.equal(memoryPlacementInvalidReason(0.7, 0.5, [object("near", 0.72, 0.51)]), "occupied");
});

test("object types use compatible island areas without over-restricting small plants", () => {
  assert.equal(memoryPlacementInvalidReason(.75, .68, [], .012, "water"), null);
  assert.equal(memoryPlacementInvalidReason(.3, .3, [], .012, "water"), "incompatible");
  assert.equal(memoryPlacementInvalidReason(.25, .3, [], .011, "flower"), null);
  assert.equal(memoryPlacementInvalidReason(.8, .25, [], .011, "lantern"), "incompatible");
});

test("screen coordinates remain normalized under a panned and zoomed world rectangle", () => {
  assert.deepEqual(
    screenPointToWorld({ x: 500, y: 350 }, { left: 100, top: 50, width: 800, height: 600 }),
    { x: 0.5, y: 0.5 },
  );
  assert.deepEqual(
    screenPointToWorld({ x: -10, y: 900 }, { left: 100, top: 50, width: 800, height: 600 }),
    { x: 0, y: 1 },
  );
});

test("an 8px-or-less gesture is a tap; a larger drag never plants", () => {
  assert.equal(isPlacementTap({ x: 10, y: 10 }, { x: 18, y: 10 }), true);
  assert.equal(isPlacementTap({ x: 10, y: 10 }, { x: 18.01, y: 10 }), false);
});

test("deterministic plant type is stable for the same memory", () => {
  const id = "8e4cc8da-8588-4a32-bdf8-2bc86da9def0";
  assert.equal(memoryPlantTypeForId(id), memoryPlantTypeForId(id));
});

test("placement removes its pending seed and the planted trace resolves its exact memory", () => {
  const seeds: PendingMemorySeed[] = [
    { memoryId: "one", date: "2026-07-15", text: "One", objectType: "wildflower" },
    { memoryId: "two", date: "2026-07-16", text: "Two", objectType: "mushroom" },
  ];
  assert.deepEqual(withoutPendingSeed(seeds, "one").map((seed) => seed.memoryId), ["two"]);
  const planted = [object("one", 0.7, 0.5), object("two", 0.8, 0.6)];
  assert.equal(resolvePlantedMemory(planted, "two")?.text, "two");
});

test("duplicate placement replaces the existing memory object rather than adding another", () => {
  const first = object("same-memory", 0.7, 0.5);
  const persisted = { ...first, id: "persisted-object" };
  const result = upsertPlantedMemory([first], persisted);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "persisted-object");
});

test("migration mirrors placement constants and enforces idempotency and authorization", async () => {
  const sql = await readFile(new URL("../supabase/migrations/0005_memory_seeds.sql", import.meta.url), "utf8");
  for (const contract of [
    "MEMORY_PLACEMENT_RULESET_V1",
    "between 0.14 and 0.88",
    "between 0.16 and 0.86",
    "between 0.28 and 0.46",
    "between 0.40 and 0.59",
    "between 0.30 and 0.48",
    "between 0.56 and 0.86",
    "< 0.035",
    "memory_id uuid not null unique",
    "pg_advisory_xact_lock",
    "security definer",
    "set search_path = public",
    "user_id = auth.uid() and is_active",
    "revoke execute",
  ]) assert.ok(sql.toLowerCase().includes(contract.toLowerCase()), `missing SQL contract: ${contract}`);
  assert.ok(
    sql.indexOf("user_id = auth.uid() and is_active") < sql.indexOf("select * into v_existing"),
    "membership authorization must happen before the idempotent return",
  );
});

test("family-day reward lifecycle supports place later, first-confirmed placement, move, and storage", async () => {
  const sql = await readFile(new URL("../supabase/migrations/0006_family_reward_placement.sql", import.meta.url), "utf8");
  for (const contract of [
    "pending_placement",
    "placed",
    "stored",
    "select_daily_island_reward",
    "d.category <> 'animal'",
    "island_reward_collision_radius",
    "place_family_day_reward",
    "move_family_day_reward",
    "store_family_day_reward",
    "pg_advisory_xact_lock",
    "if v_reward.placement_status = 'placed' then return v_reward",
    "user_id = auth.uid() and is_active",
    "position_x = null",
    "stored_at = now()",
    "revoke execute",
  ]) assert.ok(sql.toLowerCase().includes(contract.toLowerCase()), `missing reward lifecycle contract: ${contract}`);
});
