import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

function authError(req: Request) {
  const expected = process.env.ADMIN_CODE;
  const sent = req.headers.get("x-admin-code");

  if (!expected) {
    return "ADMIN_CODE is missing in server env (set it in .env.local and Vercel env).";
  }

  if (!sent) {
    return "Missing x-admin-code header.";
  }

  if (sent !== expected) {
    return "Invalid admin code.";
  }

  return null;
}

export async function POST(req: Request) {
  const err = authError(req);
  if (err) {
    return NextResponse.json({ ok: false, error: err }, { status: 401 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const mode = String(body?.mode ?? "").toLowerCase();

  try {
    if (mode === "add") {
      const fullName = String(body?.fullName ?? "").trim();
      const paxAllowed = Math.max(1, Number(body?.paxAllowed ?? 1) || 1);
      const role = String(body?.role ?? "guest").trim().toLowerCase();
      const relation = String(body?.relation ?? "").trim().toLowerCase();

      if (!fullName) {
        return NextResponse.json({ ok: false, error: "MISSING_NAME" }, { status: 400 });
      }

      const ref = await db.collection("guests").add({
        fullName,
        paxAllowed,
        role,
        relation,
        rsvpSubmitted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return NextResponse.json({ ok: true, id: ref.id });
    }

    if (mode === "edit") {
      const id = String(body?.id ?? "").trim();
      if (!id) {
        return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
      }

      const update: any = { updatedAt: Date.now() };

      if (body.fullName !== undefined) {
        const fullName = String(body.fullName ?? "").trim();
        if (!fullName) {
          return NextResponse.json({ ok: false, error: "INVALID_NAME" }, { status: 400 });
        }
        update.fullName = fullName;
      }

      if (body.paxAllowed !== undefined) {
        const paxAllowed = Math.max(1, Number(body.paxAllowed) || 1);
        update.paxAllowed = paxAllowed;
      }

      if (body.role !== undefined) {
        update.role = String(body.role ?? "guest").trim().toLowerCase();
      }

      if (body.relation !== undefined) {
        update.relation = String(body.relation ?? "").trim().toLowerCase();
      }

      await db.collection("guests").doc(id).set(update, { merge: true });
      return NextResponse.json({ ok: true });
    }

    if (mode === "delete") {
      const id = String(body?.id ?? "").trim();
      if (!id) {
        return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
      }

      await db.collection("guests").doc(id).delete();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "INVALID_MODE (use add | edit | delete)" },
      { status: 400 }
    );
  } catch (e: any) {
    console.error("Admin guest route error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
