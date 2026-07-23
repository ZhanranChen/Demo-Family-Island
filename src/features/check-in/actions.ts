"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { submitEntry } from "./api";

const schema = z.object({
  checkInDayId: z.string().uuid(),
  textContent: z.string().trim().min(1).max(2000),
});

/**
 * The only thing a Client Component is allowed to call directly — it
 * validates input with the same zod schema shape used elsewhere, delegates
 * to the feature's data-access layer, then revalidates the page that shows
 * check-in status so the "X of Y checked in" strip updates without a full
 * client-side refetch.
 */
export async function submitTextEntry(formData: FormData) {
  const parsed = schema.parse({
    checkInDayId: formData.get("checkInDayId"),
    textContent: formData.get("textContent"),
  });

  const result = await submitEntry({
    checkInDayId: parsed.checkInDayId,
    type: "text",
    textContent: parsed.textContent,
  });

  revalidatePath("/today");
  revalidatePath("/island");
  return result;
}
