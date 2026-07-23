import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // The interactive demo is deliberately isolated from authentication and
  // Supabase. Return before updateSession so opening /demo makes no API call.
  if (
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/demo"
  ) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every route except static assets and image optimization
     * files, so we don't waste a Supabase call refreshing a session for a
     * request that isn't rendering a page.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
