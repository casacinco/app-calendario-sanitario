import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("rb_uid", "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set("rb_onboarding", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
