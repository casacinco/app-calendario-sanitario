import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/bem-vindo", "/formulario", "/sucesso", "/dashboard"];
const AUTH_REDIRECT = ["/auth"];

export function middleware(req: NextRequest) {
  const uid = req.cookies.get("rb_uid")?.value;
  const needsOnboarding = req.cookies.get("rb_onboarding")?.value === "1";
  const { pathname } = req.nextUrl;

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !uid) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Member with pending onboarding: redirect to /formulario (except when already there)
  if (uid && needsOnboarding && !pathname.startsWith("/formulario") && !pathname.startsWith("/sucesso")) {
    return NextResponse.redirect(new URL("/formulario", req.url));
  }

  if (AUTH_REDIRECT.some((p) => pathname.startsWith(p)) && uid) {
    return NextResponse.redirect(
      new URL(needsOnboarding ? "/formulario" : "/bem-vindo", req.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth", "/bem-vindo/:path*", "/formulario/:path*", "/sucesso/:path*", "/dashboard/:path*"],
};
