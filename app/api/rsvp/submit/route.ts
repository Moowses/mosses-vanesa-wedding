import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/guestToken";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { sendRsvpConfirmationEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

function isAfterDeadline() {
  const iso = process.env.RSVP_DEADLINE_ISO;
  if (!iso) return false;
  return Date.now() > new Date(iso).getTime();
}

function isValidEmail(email: string) {
  const v = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    if (isAfterDeadline()) {
      return NextResponse.json({ ok: false, error: "RSVP_CLOSED" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    const token = body?.token;
    const attendance = body?.attendance as "yes" | "no" | undefined;
    const paxAttendingRaw = body?.paxAttending;
    const message = String(body?.message ?? "").trim();

    const emailRaw = typeof body?.email === "string" ? body.email : "";
    const email = emailRaw.trim().toLowerCase();

    const announcementOptIn =
      typeof body?.announcementOptIn === "boolean" ? body.announcementOptIn : undefined;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ ok: false, error: "MISSING_TOKEN" }, { status: 400 });
    }

    let payload: any = null;
    try {
      payload = verifyToken(token);
    } catch {
      payload = null;
    }

    if (!payload?.guestId) {
      return NextResponse.json({ ok: false, error: "INVALID_OR_EXPIRED" }, { status: 401 });
    }

    if (attendance !== "yes" && attendance !== "no") {
      return NextResponse.json({ ok: false, error: "INVALID_ATTENDANCE" }, { status: 400 });
    }

    const guestRef = db.collection("guests").doc(payload.guestId);
    const rsvpRef = db.collection("rsvps").doc(payload.guestId);

    const txOut = await db.runTransaction(async (tx) => {
      const [guestSnap, rsvpSnap] = await Promise.all([tx.get(guestRef), tx.get(rsvpRef)]);

      if (!guestSnap.exists) {
        return { ok: false as const, status: 404, error: "GUEST_NOT_FOUND" as const };
      }

      const g = guestSnap.data() as any;
      const paxAllowed = Number(g.paxAllowed ?? 1);
      const guestName = String(g.fullName ?? "Guest");
      const existingEmail = String(g.email ?? "").trim().toLowerCase();

      let paxAttending = 0;
      if (attendance === "yes") {
        const paxNum = Number(paxAttendingRaw);
        if (!Number.isFinite(paxNum) || paxNum < 1 || paxNum > paxAllowed) {
          return { ok: false as const, status: 400, error: "INVALID_PAX" as const };
        }
        paxAttending = paxNum;
      } else {
        paxAttending = 0;
      }

      let finalEmail = existingEmail;

      if (!existingEmail) {
        if (!email || !isValidEmail(email)) {
          return { ok: false as const, status: 400, error: "EMAIL_REQUIRED" as const };
        }
        finalEmail = email;
      }

      const rsvpData = rsvpSnap.exists ? (rsvpSnap.data() as any) : null;

      const setSubmittedAt =
        !rsvpSnap.exists || !rsvpData?.submittedAt
          ? { submittedAt: FieldValue.serverTimestamp() }
          : {};

      const alreadySent = !!rsvpData?.emailConfirmationSentAt;

      if (!existingEmail && finalEmail) {
        tx.set(
          guestRef,
          {
            email: finalEmail,
            emailUpdatedAt: FieldValue.serverTimestamp(),
            ...(announcementOptIn !== undefined ? { announcementOptIn } : {}),
          },
          { merge: true }
        );
      } else if (announcementOptIn !== undefined) {
        tx.set(guestRef, { announcementOptIn }, { merge: true });
      }

      tx.set(
        rsvpRef,
        {
          guestId: payload.guestId,
          attendance,
          paxAttending,
          message,
          updatedAt: FieldValue.serverTimestamp(),
          ...setSubmittedAt,
          email: finalEmail || null,
          ...(announcementOptIn !== undefined ? { announcementOptIn } : {}),
        },
        { merge: true }
      );

      tx.set(
        guestRef,
        {
          rsvpSubmitted: true,
          rsvpPax: paxAttending,
          rsvpAttendance: attendance,
          rsvpUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        ok: true as const,
        guestName,
        finalEmail,
        alreadySent,
      };
    });

    if (!txOut.ok) {
      return NextResponse.json({ ok: false, error: txOut.error }, { status: txOut.status });
    }

    let emailSent = false;
    let emailId: string | null = null;

    const baseUrl = process.env.PUBLIC_BASE_URL;

    if (!txOut.alreadySent && baseUrl && txOut.finalEmail) {
      try {
        const updateUrl = `${baseUrl}/rsvp/${encodeURIComponent(token)}`;

        const result = await sendRsvpConfirmationEmail({
          to: txOut.finalEmail,
          guestName: txOut.guestName,
          updateUrl,
        });

        if (result?.sent) {
          emailSent = true;
          emailId = result?.id ?? null;

          await rsvpRef.set(
            {
              emailConfirmationSentAt: FieldValue.serverTimestamp(),
              emailConfirmationProviderId: emailId,
            },
            { merge: true }
          );
        }
      } catch {
        emailSent = false;
      }
    }

    return NextResponse.json({ ok: true, emailSent, emailId });
  } catch (err) {
    console.error("RSVP submit error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
