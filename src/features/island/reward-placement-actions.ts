"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const placeSchema = z.object({
  rewardId: z.string().uuid(),
  positionX: z.number().min(0).max(100),
  positionY: z.number().min(0).max(100),
});

export async function placeFamilyDayReward(input: z.infer<typeof placeSchema>) {
  const parsed = placeSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_family_day_reward", {
    p_reward_id: parsed.rewardId,
    p_position_x: parsed.positionX,
    p_position_y: parsed.positionY,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/island");
  return data;
}

export async function moveFamilyDayReward(input: z.infer<typeof placeSchema>) {
  const parsed = placeSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("move_family_day_reward", {
    p_reward_id: parsed.rewardId,
    p_position_x: parsed.positionX,
    p_position_y: parsed.positionY,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/island");
  return data;
}

export async function storeFamilyDayReward(rewardId: string) {
  const id = z.string().uuid().parse(rewardId);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("store_family_day_reward", {
    p_reward_id: id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/island");
  return data;
}
