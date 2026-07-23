import { IslandScene } from "@/features/island/components/island-scene";
import { MOCK_ISLAND_OBJECTS } from "@/features/island/lib/mockIslandObjects";
import { NavBar } from "@/components/layout/nav-bar";
import { createClient } from "@/lib/supabase/server";
import { getIslandData } from "@/features/island/api";

/**
 * Renders the hand-composed prototype scene (MOCK_ISLAND_OBJECTS) rather
 * than a family's real data for now — this route's job today is to prove
 * out layering, scale, and spacing in the new asset-driven renderer. See
 * TODO.md for swapping this back to `getIslandData(familyId)`, which is
 * already implemented and ready in features/island/api.ts.
 */
export default async function IslandPage({
  searchParams,
}: {
  searchParams: Promise<{ reveal?: string }>;
}) {
  const [{ reveal }, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .limit(1)
    .maybeSingle();
  const data = membership
    ? await getIslandData(membership.family_id)
    : reveal
      ? { growthLevel: 10, objects: MOCK_ISLAND_OBJECTS, waitingRewards: [] }
      : {
          growthLevel: 1,
          objects: [],
          waitingRewards: [{
            id: "7f4f7b16-63e1-4a62-b6f7-79b94a7a1610",
            objectType: "flower" as const,
            assetKey: "flowers_meadow_webp_01",
            positionX: 70,
            positionY: 50,
            scale: 1,
            rotation: 0,
            zIndex: 80,
            unlockedAt: "2026-07-16T12:00:00Z",
            memoryId: "7f4f7b16-63e1-4a62-b6f7-79b94a7a1610",
            name: "Meadow flowers",
            rarity: "common" as const,
            linkedMemorySummary: "We cooked noodles together after work.",
            placementStatus: "pending_placement" as const,
          }, {
            id: "40506acf-1329-42e7-8b12-06f385a51931",
            objectType: "tree" as const,
            assetKey: "tree_pine_webp_01",
            positionX: 66, positionY: 46, scale: .72, rotation: 0, zIndex: 76,
            unlockedAt: "2026-07-16T12:01:00Z", memoryId: "40506acf-1329-42e7-8b12-06f385a51931",
            name: "Young pine", rarity: "common" as const,
            linkedMemorySummary: "A quiet day we completed together.",
            placementStatus: "pending_placement" as const,
          }, {
            id: "ac03623a-776d-499c-bdbd-a99c3dddf0e6",
            objectType: "lantern" as const,
            assetKey: "lantern_path_webp_01",
            positionX: 62, positionY: 64, scale: .62, rotation: 0, zIndex: 94,
            unlockedAt: "2026-07-16T12:02:00Z", memoryId: "ac03623a-776d-499c-bdbd-a99c3dddf0e6",
            name: "Path lantern", rarity: "uncommon" as const,
            linkedMemorySummary: "We all made time to check in.",
            placementStatus: "pending_placement" as const,
          }, {
            id: "a51feab4-58f3-46a9-8b98-897d175d6f47",
            objectType: "furniture" as const,
            assetKey: "bench_garden_webp_01",
            positionX: 68, positionY: 68, scale: .78, rotation: 0, zIndex: 98,
            unlockedAt: "2026-07-16T12:03:00Z", memoryId: "a51feab4-58f3-46a9-8b98-897d175d6f47",
            name: "Garden bench", rarity: "uncommon" as const,
            linkedMemorySummary: "A place to remember today together.",
            placementStatus: "pending_placement" as const,
          }, {
            id: "b77c4e9a-d8c9-47ec-a224-282280cc0446",
            objectType: "water" as const,
            assetKey: "pond_lily_webp_01",
            positionX: 71, positionY: 75, scale: .7, rotation: 0, zIndex: 105,
            unlockedAt: "2026-07-16T12:05:00Z", memoryId: "b77c4e9a-d8c9-47ec-a224-282280cc0446",
            name: "Little pond", rarity: "rare" as const,
            linkedMemorySummary: "Today left a calm place on our island.",
            placementStatus: "pending_placement" as const,
          }, {
            id: "9fe8de8d-0c88-4901-a90e-8560d6060ab5",
            objectType: "landmark" as const,
            assetKey: "tree_deciduous_webp_01",
            positionX: 72, positionY: 48, scale: 1, rotation: 0, zIndex: 78,
            unlockedAt: "2026-07-16T12:06:00Z", memoryId: "9fe8de8d-0c88-4901-a90e-8560d6060ab5",
            name: "Family tree", rarity: "milestone" as const,
            linkedMemorySummary: "A milestone our family reached together.",
            placementStatus: "pending_placement" as const,
          }, {
            id: "47fced08-c373-4327-ad11-a46b8eab89a5",
            objectType: "garden" as const,
            assetKey: "mushrooms_red_webp_01",
            positionX: 67, positionY: 62, scale: .58, rotation: 0, zIndex: 92,
            unlockedAt: "2026-07-16T12:07:00Z", memoryId: "47fced08-c373-4327-ad11-a46b8eab89a5",
            name: "Woodland mushrooms", rarity: "uncommon" as const,
            linkedMemorySummary: "A small surprise grew from today.",
            placementStatus: "pending_placement" as const,
          }],
        };

  return (
    <>
      <NavBar />
      <main className="island-page-shell">
        <IslandScene
          data={data}
          revealObjectId={reveal}
          demoMode={!membership}
        />
      </main>
    </>
  );
}
