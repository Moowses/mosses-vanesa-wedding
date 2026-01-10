import { NextResponse } from "next/server";
import crypto from "crypto";

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = body?.code;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ ok: false, error: "MISSING_CODE" }, { status: 400 });
  }

  if (code !== process.env.ADMIN_CODE) {
    return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 401 });
  }

  const secret = process.env.ADMIN_COOKIE_SECRET!;
  const payload = `admin:${Date.now()}`;
  const sig = sign(payload, secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", `${payload}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}
