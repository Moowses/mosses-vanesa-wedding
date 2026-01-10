import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/guestToken";
import { db } from "@/lib/firebaseAdmin";

// Prevent any caching issues in dev/prod
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token;

    
    if (!token || typeof token !== "string") {
      return NextResponse.json({ ok: false, error: "MISSING_TOKEN" }, { status: 400 });
    }

  
    let payload: { guestId: string; exp?: number | null } | null = null;
    try {
      payload = verifyToken(token);
    } catch {
      payload = null;
    }

    if (!payload?.guestId) {
      return NextResponse.json({ ok: false, error: "INVALID_OR_EXPIRED" }, { status: 401 });
    }

    const guestDoc = await db.collection("guests").doc(payload.guestId).get();
    if (!guestDoc.exists) {
      return NextResponse.json({ ok: false, error: "GUEST_NOT_FOUND" }, { status: 404 });
    }

    const g = guestDoc.data() as any;

    return NextResponse.json({
      ok: true,
      guest: {
        guestId: guestDoc.id,
        fullName: g.fullName ?? g.GUEST ?? "",
        paxAllowed: Number(g.paxAllowed ?? g.PAX ?? 1),
        role: g.role ?? g.Role ?? "",
        relation: g.relation ?? g.Relation ?? "",
        rsvpSubmitted: !!g.rsvpSubmitted,
      },
      deadlineIso: process.env.RSVP_DEADLINE_ISO ?? null,
    });
  } catch (err) {
    console.error("RSVP verify error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
