import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/guestToken";
import { db, admin } from "@/lib/firebaseAdmin";

function isAfterDeadline() {
  const iso = process.env.RSVP_DEADLINE_ISO;
  if (!iso) return false;
  return Date.now() > new Date(iso).getTime();
}

export async function POST(req: Request) {
  // After deadline: block submissions/edits
  if (isAfterDeadline()) {
    return NextResponse.json({ ok: false, error: "RSVP_CLOSED" }, { status: 403 });
  }

  const { token, paxAttending, message } = await req.json();

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "INVALID_OR_EXPIRED" }, { status: 401 });
  }

  const guestRef = db.collection("guests").doc(payload.guestId);
  const rsvpRef = db.collection("rsvps").doc(payload.guestId);

  await db.runTransaction(async (tx) => {
    const guestSnap = await tx.get(guestRef);
    if (!guestSnap.exists) throw new Error("GUEST_NOT_FOUND");

    const guest = guestSnap.data() as any;
    const max = Number(guest.paxAllowed ?? 1);

    const pax = Number(paxAttending);
    if (!Number.isFinite(pax) || pax < 1 || pax > max) {
      throw new Error("INVALID_PAX");
    }

    // Always store attendance "yes"
    tx.set(
      rsvpRef,
      {
        guestId: payload.guestId,
        attendance: "yes",
        paxAttending: pax,
        message: String(message ?? "").trim(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // set submittedAt if first time
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      guestRef,
      {
        rsvpSubmitted: true,
        rsvpPax: pax, // optional helper field for quick admin filtering
        rsvpUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return NextResponse.json({ ok: true });
}
