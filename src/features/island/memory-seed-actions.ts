"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { memoryPlantTypeForId } from "./lib/memoryPlantRegistry";

const placementSchema = z.object({
  memoryId: z.string().uuid(),
  positionX: z.number().min(0).max(1),
  positionY: z.number().min(0).max(1),
});

export async function plantMemorySeed(input: {
  memoryId: string;
  positionX: number;
  positionY: number;
}) {
  const parsed = placementSchema.parse(input);
  const supabase = await createClient();
  const objectType = memoryPlantTypeForId(parsed.memoryId);
  const rotation = ((parsed.memoryId.charCodeAt(0) % 21) - 10) * 0.7;

  const { data, error } = await supabase.rpc("place_memory_seed", {
    p_memory_id: parsed.memoryId,
    p_object_type: objectType,
    p_position_x: parsed.positionX,
    p_position_y: parsed.positionY,
    p_scale: 1,
    p_rotation: rotation,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/island");
  return data;
}
