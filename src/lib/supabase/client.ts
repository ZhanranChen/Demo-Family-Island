import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { env } from "@/lib/env";

/**
 * Supabase client for Client Components ("use client").
 *
 * Why a separate file from server.ts: the browser client reads/writes the
 * session via document.cookie, while the server client reads/writes it via
 * Next's cookies() API. They are not interchangeable, so we make the choice
 * explicit at the import site — `@/lib/supabase/client` vs
 * `@/lib/supabase/server` — instead of one "smart" client that tries to
 * detect its environment.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
