import { z } from "zod";

/**
 * Fail fast with a readable error at boot if a required env var is missing,
 * instead of a cryptic "fetch failed" the first time Supabase is called.
 * Only NEXT_PUBLIC_* vars belong here — never parse SUPABASE_SERVICE_ROLE_KEY
 * through a module that could end up in a client bundle.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
