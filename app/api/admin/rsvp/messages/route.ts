import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

function isAuthed(req: Request) {
  return req.headers.get("x-admin-code") === "1433";
}

export async function GET(req: Request) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const snap = await db.collection("rsvps").orderBy("submittedAt", "desc").limit(300).get();

  const messages = snap.docs
    .map((doc) => {
      const x = doc.data() as any;
      return {
        id: doc.id,
        guestId: x.guestId ?? null,
        email: x.email ?? null,
        attendance: x.attendance ?? null,
        announcementOptIn: !!x.announcementOptIn,
        paxAttending: x.paxAttending ?? null,
        message: x.message ?? "",
        submittedAt: x.submittedAt?.toDate ? x.submittedAt.toDate().toISOString() : null,
      };
    })
    .filter((m) => String(m.message || "").trim().length > 0);

  return NextResponse.json({ ok: true, messages });
}
