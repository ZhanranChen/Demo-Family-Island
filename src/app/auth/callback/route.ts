import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * The URL Supabase's magic-link email points at. This has to be a Route
 * Handler, not a Server Component page — exchanging the code requires
 * *writing* the resulting session cookie, and only Route Handlers (and
 * middleware) can set cookies in the App Router; Server Components can only
 * read them.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: membership } = await supabase
        .from("family_members")
        .select("family_id")
        .limit(1)
        .maybeSingle();

      return NextResponse.redirect(
        `${origin}${membership ? "/today" : "/join-family"}`,
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
