"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.string().email() });

interface SendMagicLinkResult {
  ok: boolean;
  message: string;
}

/**
 * Passwordless sign-in over password auth: no "family member forgot the
 * password" support burden, and one fewer thing standing between opening
 * the app and sharing today's moment. The tradeoff — an extra round trip
 * through email — is fine for a once-a-day ritual app; it would be a worse
 * choice for something used dozens of times a day.
 */
export async function sendMagicLink(
  _prev: SendMagicLinkResult | null,
  formData: FormData,
): Promise<SendMagicLinkResult> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      // Must be listed in the Supabase project's Auth → URL Configuration
      // → Redirect URLs allow-list, or the callback will be rejected.
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Check your email for a sign-in link." };
}
