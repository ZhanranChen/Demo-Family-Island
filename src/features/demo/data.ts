import type { IslandMemoryRecord, IslandObjectRecord } from "@/features/island/types";

export const DEMO_FAMILY = {
  id: "demo-family",
  name: "The Chen Family",
  streak: 12,
  members: ["Mom", "Dad", "Jocelyn"],
};

export const INITIAL_MEMORIES: IslandMemoryRecord[] = [
  { id: "demo-memory-1", authorName: "The Chen Family", content: "Dumpling night after dinner.", category: "Everyday Moment", createdAt: "2026-07-18T18:30:00.000Z", entries: [
    { authorName: "Mom", content: "We made dumplings together after dinner." },
    { authorName: "Dad", content: "Mine looked crooked, but everyone still ate them." },
    { authorName: "Jocelyn", content: "Mom showed me how to fold the little edges properly." },
  ] },
  { id: "demo-memory-2", authorName: "The Chen Family", content: "A sunset shared from Dad’s walk.", category: "Gratitude", createdAt: "2026-07-19T20:10:00.000Z", entries: [
    { authorName: "Mom", content: "Dad’s sunset photo made the whole evening feel softer." },
    { authorName: "Dad", content: "I sent everyone a photo of the sunset on my walk." },
    { authorName: "Jocelyn", content: "I saved the picture because the sky looked painted." },
  ] },
  { id: "demo-memory-3", authorName: "The Chen Family", content: "A video call nobody wanted to end.", category: "Celebration", createdAt: "2026-07-20T21:00:00.000Z", entries: [
    { authorName: "Mom", content: "Hearing everyone laugh together made my day." },
    { authorName: "Dad", content: "I kept saying one more story before we hung up." },
    { authorName: "Jocelyn", content: "We stayed on a video call longer than planned because nobody wanted to hang up." },
  ] },
];

export const INITIAL_OBJECTS: IslandObjectRecord[] = [
  // The production terrain layer already contains the starter cabin and main
  // path; growth objects stay separate and interactive above that base.
  { id: "demo-memory-object-1", objectType: "flower", assetKey: "flowers_meadow_webp_01", positionX: 57, positionY: 57, scale: 1, rotation: -2, zIndex: 87, unlockedAt: INITIAL_MEMORIES[0]!.createdAt, memoryId: INITIAL_MEMORIES[0]!.id, name: "Dumpling-day flowers", linkedMemorySummary: INITIAL_MEMORIES[0]!.content, placementStatus: "placed" },
  { id: "demo-memory-object-2", objectType: "lantern", assetKey: "lantern_path_webp_01", positionX: 53, positionY: 51, scale: .86, rotation: 1, zIndex: 81, unlockedAt: INITIAL_MEMORIES[1]!.createdAt, memoryId: INITIAL_MEMORIES[1]!.id, name: "Sunset lantern", linkedMemorySummary: INITIAL_MEMORIES[1]!.content, placementStatus: "placed" },
  { id: "demo-memory-object-3", objectType: "tree", assetKey: "tree_deciduous_webp_01", positionX: 68, positionY: 35, scale: .9, rotation: 2, zIndex: 45, unlockedAt: INITIAL_MEMORIES[2]!.createdAt, memoryId: INITIAL_MEMORIES[2]!.id, name: "Long-call tree", linkedMemorySummary: INITIAL_MEMORIES[2]!.content, placementStatus: "placed" },
  { id: "demo-bench", objectType: "furniture", assetKey: "bench_garden_webp_01", positionX: 49, positionY: 61, scale: .86, rotation: 0, zIndex: 91, unlockedAt: "2026-07-10T12:00:00Z", memoryId: "demo-memory-3", name: "Garden bench", linkedMemorySummary: INITIAL_MEMORIES[2]!.content, placementStatus: "placed" },
  { id: "demo-pond", objectType: "water", assetKey: "pond_lily_webp_01", positionX: 29, positionY: 69, scale: .82, rotation: -2, zIndex: 119, unlockedAt: "2026-07-08T12:00:00Z", memoryId: "demo-memory-1", name: "Lily pond", linkedMemorySummary: INITIAL_MEMORIES[0]!.content, placementStatus: "placed" },
  { id: "demo-cat", objectType: "animal", assetKey: "cat_orange_webp_01", positionX: 57, positionY: 66, scale: .7, rotation: 1, zIndex: 111, unlockedAt: "2026-07-09T12:00:00Z", memoryId: "demo-memory-2", name: "Marmalade the cat", linkedMemorySummary: INITIAL_MEMORIES[1]!.content, placementStatus: "placed" },
  { id: "demo-mushrooms", objectType: "garden", assetKey: "mushrooms_red_webp_01", positionX: 76, positionY: 56, scale: .72, rotation: 3, zIndex: 86, unlockedAt: "2026-07-11T12:00:00Z", memoryId: "demo-memory-3", name: "Woodland mushrooms", linkedMemorySummary: INITIAL_MEMORIES[2]!.content, placementStatus: "placed" },
  { id: "demo-pine-right", objectType: "tree", assetKey: "tree_pine_webp_01", positionX: 84, positionY: 27, scale: .82, rotation: -2, zIndex: 37, unlockedAt: "2026-07-06T12:00:00Z", memoryId: "demo-memory-2", name: "Hillside pine", linkedMemorySummary: INITIAL_MEMORIES[1]!.content, placementStatus: "placed" },
  { id: "demo-flower-edge", objectType: "flower", assetKey: "flowers_meadow_webp_01", positionX: 70, positionY: 64, scale: .72, rotation: -3, zIndex: 94, unlockedAt: "2026-07-12T12:00:00Z", memoryId: "demo-memory-1", name: "Meadow edge flowers", linkedMemorySummary: INITIAL_MEMORIES[0]!.content, placementStatus: "placed" },
];

export const CATEGORY_LABELS = { everyday: "Everyday Moment", celebration: "Celebration", gratitude: "Gratitude", adventure: "Adventure" } as const;
