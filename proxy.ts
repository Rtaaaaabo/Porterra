import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isEmailAllowedInProduction, isProductionAccessRestrictionEnabled } from "@/lib/access-control";

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/login") return true;
  if (pathname === "/register") return true;
  return /\.[^/]+$/.test(pathname);
}

export default auth((request) => {
  if (!isProductionAccessRestrictionEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const email = request.auth?.user?.email;
  if (!email || !isEmailAllowedInProduction(email)) {
    const url = new URL("/login?error=forbidden", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/:path*"],
};
