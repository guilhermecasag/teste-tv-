import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  MONTADOR: "/app",
  ESPECTADOR: "/espectador",
};

const AREA_PREFIX: Record<string, string> = {
  "/admin": "ADMIN",
  "/app": "MONTADOR",
  "/espectador": "ESPECTADOR",
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isLoginPage = nextUrl.pathname === "/login";

  const matchedArea = Object.entries(AREA_PREFIX).find(([prefix]) =>
    nextUrl.pathname.startsWith(prefix)
  );

  if (!isLoggedIn) {
    if (isLoginPage) return NextResponse.next();
    if (matchedArea) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL(ROLE_HOME[role ?? ""] ?? "/", nextUrl));
  }

  if (matchedArea) {
    const [, requiredRole] = matchedArea;
    if (role !== requiredRole) {
      return NextResponse.redirect(new URL(ROLE_HOME[role ?? ""] ?? "/", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/app/:path*", "/espectador/:path*", "/login"],
};
