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

    const guestRef = db.collection("guests").doc(payload.guestId);
    const rsvpRef = db.collection("rsvps").doc(payload.guestId);

    // Fetch both in parallel
    const [guestDoc, rsvpDoc] = await Promise.all([guestRef.get(), rsvpRef.get()]);

    if (!guestDoc.exists) {
      return NextResponse.json({ ok: false, error: "GUEST_NOT_FOUND" }, { status: 404 });
    }

    const g = guestDoc.data() as any;
    const r = rsvpDoc.exists ? (rsvpDoc.data() as any) : null;

    // Normalize fields
    const paxAllowed = Number(g.paxAllowed ?? g.PAX ?? 1);
    const email = typeof g.email === "string" ? g.email : null;
    const announcementOptIn =
      typeof g.announcementOptIn === "boolean" ? g.announcementOptIn : null;

    // RSVP info for prefilling the form
    const rsvp = r
      ? {
          attendance: r.attendance ?? null, // "yes" | "no"
          paxAttending: Number(r.paxAttending ?? 0),
          message: typeof r.message === "string" ? r.message : "",
          submittedAt: r.submittedAt ?? null,
          updatedAt: r.updatedAt ?? null,
        }
      : {
          attendance: null,
          paxAttending: 0,
          message: "",
          submittedAt: null,
          updatedAt: null,
        };

    return NextResponse.json({
      ok: true,
      guest: {
        guestId: guestDoc.id,
        fullName: g.fullName ?? g.GUEST ?? "",
        paxAllowed,
        role: g.role ?? g.Role ?? "",
        relation: g.relation ?? g.Relation ?? "",
        rsvpSubmitted: !!g.rsvpSubmitted,

        // NEW: expose email + consent so UI can decide whether to show input
        email,
        announcementOptIn,
      },

      // NEW: include RSVP doc so form can prefill accurately
      rsvp,

      deadlineIso: process.env.RSVP_DEADLINE_ISO ?? null,
    });
  } catch (err) {
    console.error("RSVP verify error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
