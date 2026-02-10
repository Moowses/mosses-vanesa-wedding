import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { Resend } from "resend";

const RATE_DELAY_MS = 600; // safe vs Resend 2 req/sec
const MAX_RECIPIENTS = 800;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isAuthed(req: Request) {
  return req.headers.get("x-admin-code") === "1433";
}

const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function personalize(
  raw: string,
  vars: { fullName: string; paxAllowed: number }
) {
  return raw
    .replace(/#fullname/gi, vars.fullName)
    .replace(/#paxallowed/gi, String(vars.paxAllowed));
}

function buildHtml(subject: string, bodyHtml: string) {
  return `
  <div style="background:#f6f6f6;padding:24px 0;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;font-family:Arial,Helvetica,sans-serif;">
      <tr>
        <td>
          <img src="https://mossesandvanesa.com/headeremail.png"
               style="width:100%;display:block" />
        </td>
      </tr>
      <tr>
        <td style="padding:22px 28px;color:#222;">
          <h2 style="margin:0 0 12px;font-size:18px;">${esc(subject)}</h2>
          <div style="font-size:15px;line-height:1.7;">
            ${bodyHtml}
          </div>
          <hr style="margin:22px 0;border:none;border-top:1px solid #eee;" />
          <p style="font-size:13px;color:#666;">
            View the Live Wall at
            <a href="https://www.mossesandvanesa.com#live"
               style="color:#c07a5a;font-weight:bold;text-decoration:none;">
              www.mossesandvanesa.com#live
            </a>
            .
          </p>
        </td>
      </tr>
    </table>
  </div>
  `.trim();
}

async function sendWithRetry(resend: Resend, payload: any) {
  try {
    return await resend.emails.send(payload);
  } catch (err: any) {
    const msg = String(err?.message || "");
    const status = err?.status || err?.statusCode || 0;
    if (status !== 429 && !msg.includes("429")) throw err;
    await sleep(1100);
    return await resend.emails.send(payload);
  }
}


declare global {
  var __ANNOUNCE_LOCK__: boolean | undefined;
  var __ANNOUNCE_LAST__: number | undefined;
}

export async function POST(req: Request) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (globalThis.__ANNOUNCE_LOCK__) {
    return NextResponse.json(
      { ok: false, error: "Announcement already running" },
      { status: 429 }
    );
  }

  if (Date.now() - (globalThis.__ANNOUNCE_LAST__ || 0) < 20_000) {
    return NextResponse.json(
      { ok: false, error: "Please wait before sending again" },
      { status: 429 }
    );
  }

  const { subject, body, optInOnly, audience, confirmProduction, dryRun } = await req.json();

  if (!subject || !body) {
    return NextResponse.json(
      { ok: false, error: "Subject and body required" },
      { status: 400 }
    );
  }

  const selectedAudience = audience === "guestbackup" ? "guestbackup" : "guests";
  const isDryRun = dryRun === true;

  if (selectedAudience === "guests" && !isDryRun && confirmProduction !== true) {
    return NextResponse.json(
      {
        ok: false,
        error: "confirmProduction=true is required when sending to guests",
      },
      { status: 400 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const from = process.env.EMAIL_FROM!;
  const rsvpsSnap = await db.collection("rsvps").get();
  const emails = Array.from(
    new Set(
      rsvpsSnap.docs
        .map((d) => d.data())
        .filter((x: any) => x?.email && (!optInOnly || x.announcementOptIn))
        .map((x: any) => String(x.email).toLowerCase().trim())
    )
  );

  if (emails.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { ok: false, error: "Too many recipients" },
      { status: 400 }
    );
  }
  const guestsSnap = await db.collection(selectedAudience).get();
  const guestMap = new Map<
    string,
    { fullName: string; paxAllowed: number }
  >();

  for (const d of guestsSnap.docs) {
    const g: any = d.data();
    const email = String(g?.email || "").toLowerCase().trim();
    if (!email) continue;

    guestMap.set(email, {
      fullName: g.fullName || "Guest",
      paxAllowed: Math.max(1, Number(g.paxAllowed || 1)),
    });
  }

  const recipients = emails.filter((email) => guestMap.has(email));

  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { ok: false, error: "Too many recipients" },
      { status: 400 }
    );
  }

  if (isDryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      audience: selectedAudience,
      total: recipients.length,
      sent: 0,
      failedCount: 0,
    });
  }

  let sent = 0;
  let failed = 0;

  globalThis.__ANNOUNCE_LOCK__ = true;
  globalThis.__ANNOUNCE_LAST__ = Date.now();

  try {
    for (const to of recipients) {
      const guest = guestMap.get(to) ?? {
        fullName: "Guest",
        paxAllowed: 1,
      };

      const subj = personalize(subject, guest);
      const bodyHtml = esc(
        personalize(body, guest)
      ).replace(/\n/g, "<br/>");

      try {
        await sendWithRetry(resend, {
          from,
          to,
          subject: subj,
          html: buildHtml(subj, bodyHtml),
        });
        sent++;
      } catch {
        failed++;
      }

      await sleep(RATE_DELAY_MS);
    }
  } finally {
    globalThis.__ANNOUNCE_LOCK__ = false;
    globalThis.__ANNOUNCE_LAST__ = Date.now();
  }

  return NextResponse.json({
    ok: true,
    audience: selectedAudience,
    dryRun: false,
    sent,
    failedCount: failed,
    total: recipients.length,
  });
}

