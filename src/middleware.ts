import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Serve the Webflow-exported homepage at `/` while keeping the file at `/index.html`
 * for parity with all other `.html` links in the export.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/index.html";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
