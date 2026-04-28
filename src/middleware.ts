import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/bem-vindo", "/formulario", "/sucesso"];
const AUTH_REDIRECT = ["/auth"];

export function middleware(req: NextRequest) {
  const uid = req.cookies.get("rb_uid")?.value;
  const { pathname } = req.nextUrl;

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !uid) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (AUTH_REDIRECT.some((p) => pathname.startsWith(p)) && uid) {
    return NextResponse.redirect(new URL("/bem-vindo", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth", "/bem-vindo/:path*", "/formulario/:path*", "/sucesso/:path*"],
};
