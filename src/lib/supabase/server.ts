import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { env } from "@/lib/env";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 *
 * This must be created fresh on every request (never module-level singleton)
 * because it's bound to that request's cookies via next/headers. Sharing one
 * instance across requests would leak one user's session into another's.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` is called from a Server Component in some render
            // paths, where cookies() is read-only. It's safe to ignore here
            // because the session is also refreshed by middleware.ts on
            // every request, which *can* write cookies.
          }
        },
      },
    },
  );
}
