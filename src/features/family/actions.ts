"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

interface FormResult {
  ok: boolean;
  message: string;
  inviteCode?: string;
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Give your family a name.").max(60),
});

/**
 * Delegates to the `create_family` Postgres function (see
 * supabase/migrations/0002_...sql) rather than inserting into `families`
 * and `family_members` directly from here. Two inserts that must both
 * succeed or both fail belong in one atomic database function, not
 * sequenced across two client round trips where the second insert could
 * fail and leave an orphaned family with no members.
 */
export async function createFamily(
  _prev: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const parsed = createSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid name." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_family", {
    p_name: parsed.data.name,
  });

  if (error) return { ok: false, message: error.message };

  return {
    ok: true,
    message: "Your island is ready. Share this code with your family:",
    inviteCode: data.invite_code,
  };
}

const joinSchema = z.object({
  inviteCode: z.string().trim().length(8, "Invite codes are 8 characters."),
});

export async function joinFamily(
  _prev: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const parsed = joinSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid code." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_family", {
    p_invite_code: parsed.data.inviteCode,
  });

  if (error) return { ok: false, message: error.message };

  redirect("/today");
}
