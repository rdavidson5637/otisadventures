import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  FAMILY_SESSION_COOKIE,
} from "@/lib/session-cookies";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const familySession = request.cookies.get(FAMILY_SESSION_COOKIE);
  const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE);

  const isLoginPage = pathname === "/otis/login";
  const isAdminPage = pathname === "/otis/admin";
  const isAuthApi = pathname.startsWith("/api/otis/family/auth");

  if (isLoginPage || isAdminPage || isAuthApi) {
    return NextResponse.next();
  }

  if (!familySession?.value && !adminSession?.value) {
    return NextResponse.redirect(new URL("/otis/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/otis/:path*"],
};
