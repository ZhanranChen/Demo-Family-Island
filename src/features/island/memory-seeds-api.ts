import "server-only";
import { createClient } from "@/lib/supabase/server";
import { memoryPlantTypeForId } from "./lib/memoryPlantRegistry";
import type {
  PendingMemorySeed,
  PlantedMemoryObject,
  MemoryPlantType,
} from "./memory-seed-types";

interface RawMemory {
  id: string;
  user_id: string;
  type: "text" | "voice" | "photo";
  text_content: string | null;
  media_url: string | null;
  day: { family_id: string; date: string } | null;
}

interface RawMemoryObject {
  id: string;
  family_id: string;
  memory_id: string;
  object_type: MemoryPlantType;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
  growth_stage: number;
  placed_at: string;
}

export async function getMemorySeedState(familyId: string): Promise<{
  pendingSeeds: PendingMemorySeed[];
  plantedObjects: PlantedMemoryObject[];
}> {
  const supabase = await createClient();
  const [{ data: rawMemories }, { data: rawObjects }] = await Promise.all([
    supabase
      .from("entries")
      .select("id, user_id, type, text_content, media_url, day:check_in_days!inner(family_id, date)")
      .eq("day.family_id", familyId) as unknown as Promise<{ data: RawMemory[] | null }>,
    supabase
      .from("island_memory_objects")
      .select("id, family_id, memory_id, object_type, position_x, position_y, scale, rotation, growth_stage, placed_at")
      .eq("family_id", familyId)
      .order("placed_at", { ascending: true }) as unknown as Promise<{ data: RawMemoryObject[] | null }>,
  ]);

  const memories = rawMemories ?? [];
  const objects = rawObjects ?? [];
  const memoryById = new Map(memories.map((memory) => [memory.id, memory]));
  const plantedIds = new Set(objects.map((object) => object.memory_id));
  const userIds = [...new Set(memories.map((memory) => memory.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));

  return {
    pendingSeeds: memories
      .filter((memory) => !plantedIds.has(memory.id))
      .map((memory) => ({
        memoryId: memory.id,
        date: memory.day?.date ?? "",
        text: memory.text_content,
        objectType: memoryPlantTypeForId(memory.id),
      })),
    plantedObjects: objects.flatMap((object) => {
      const memory = memoryById.get(object.memory_id);
      if (!memory) return [];
      return [{
        id: object.id,
        familyId: object.family_id,
        memoryId: object.memory_id,
        objectType: object.object_type,
        positionX: object.position_x,
        positionY: object.position_y,
        scale: object.scale,
        rotation: object.rotation,
        growthStage: object.growth_stage,
        placedAt: object.placed_at,
        memoryDate: memory.day?.date ?? object.placed_at,
        title: null,
        text: memory.text_content,
        mediaUrl: memory.media_url,
        mediaType: memory.type,
        contributorName: profileById.get(memory.user_id) ?? null,
      }];
    }),
  };
}
